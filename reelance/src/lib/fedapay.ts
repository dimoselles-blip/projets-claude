import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "@/lib/config";

/**
 * Client minimal de l'API REST FedaPay (https://docs.fedapay.com).
 * Mêmes appels que le SDK officiel `fedapay` (Node), sans dépendance :
 *  - POST /v1/transactions           créer une transaction (encaissement)
 *  - POST /v1/transactions/:id/token obtenir l'URL de paiement hébergée
 *  - GET  /v1/transactions/:id       vérifier le statut
 *  - POST /v1/payouts                créer un décaissement (reversement Mobile Money)
 *  - PUT  /v1/payouts/start          envoyer le décaissement
 *  - GET  /v1/payouts/:id            vérifier le statut d'un décaissement
 * Les réponses sont enveloppées : { "v1/transaction": {...} }.
 */

export class FedapayError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "FedapayError";
  }
}

export type FedapayTransaction = {
  id: number;
  reference: string;
  amount: number;
  status: string; // pending | approved | declined | canceled | refunded | transferred | expired…
  description?: string;
  mode?: string | null;
  callback_url?: string;
  approved_at?: string | null;
};

export type FedapayPayout = {
  id: number;
  reference: string;
  amount: number;
  status: string; // pending | started | processing | sent | failed
  mode?: string | null;
  last_error_code?: string | null;
  last_error_message?: string | null;
  sent_at?: string | null;
};

type FedapayCustomer = {
  firstname: string;
  lastname: string;
  email: string;
  phone_number?: { number: string; country: string };
};

async function request<T>(method: "GET" | "POST" | "PUT", path: string, body?: unknown): Promise<T> {
  if (!config.fedapay.secretKey) {
    throw new FedapayError("FEDAPAY_SECRET_KEY n'est pas configurée.");
  }
  const res = await fetch(`${config.fedapay.apiBase}/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.fedapay.secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const message =
      (json as { message?: string })?.message ??
      (json as { errors?: unknown })?.errors?.toString() ??
      `HTTP ${res.status}`;
    throw new FedapayError(`FedaPay : ${message}`, res.status, json);
  }
  return json as T;
}

/** Extrait l'objet d'une réponse enveloppée (« v1/transaction » ou « transaction »). */
function unwrap<T>(data: unknown, key: string): T {
  const obj = data as Record<string, unknown>;
  return (obj?.[`v1/${key}`] ?? obj?.[key] ?? obj) as T;
}

const DIAL_CODES: Record<string, string> = { bj: "229", tg: "228", ci: "225", sn: "221", bf: "226", ml: "223", ne: "227", gn: "224" };

/** Normalise un numéro au format international (+229…). */
export function normalizePhone(phone: string, country: string) {
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  const dial = DIAL_CODES[country.toLowerCase()];
  if (dial && cleaned.startsWith(dial) && cleaned.length > 10) return `+${cleaned}`;
  return dial ? `+${dial}${cleaned}` : cleaned;
}

// ───────────── Encaissements ─────────────

export async function createTransaction(input: {
  amountXof: number;
  description: string;
  callbackUrl: string;
  customer: FedapayCustomer;
}) {
  const data = await request<unknown>("POST", "/transactions", {
    description: input.description.slice(0, 250),
    amount: input.amountXof,
    currency: { iso: config.fedapay.currency },
    callback_url: input.callbackUrl,
    customer: input.customer,
  });
  return unwrap<FedapayTransaction>(data, "transaction");
}

export async function generatePaymentLink(transactionId: number | string) {
  // Réponse à plat : { token, url } (voir le SDK officiel, Transaction.generateToken).
  const data = await request<{ token?: string; url?: string; "v1/token"?: { token: string; url: string } }>(
    "POST",
    `/transactions/${transactionId}/token`,
    {},
  );
  const link = data.url ? data : data["v1/token"];
  if (!link?.url) throw new FedapayError("FedaPay n'a pas renvoyé d'URL de paiement.", undefined, data);
  return { token: link.token ?? "", url: link.url };
}

export async function retrieveTransaction(transactionId: number | string) {
  const data = await request<unknown>("GET", `/transactions/${transactionId}`);
  return unwrap<FedapayTransaction>(data, "transaction");
}

/** Statuts considérés comme payés (identiques au SDK officiel). */
const PAID_STATUSES = ["approved", "transferred", "refunded", "approved_partially_refunded", "transferred_partially_refunded"];

export function mapTransactionStatus(status: string): "APPROVED" | "DECLINED" | "CANCELED" | "PENDING" {
  const s = status.toLowerCase();
  if (PAID_STATUSES.includes(s)) return "APPROVED";
  if (s === "declined") return "DECLINED";
  if (["canceled", "cancelled", "expired"].includes(s)) return "CANCELED";
  return "PENDING";
}

// ───────────── Décaissements (reversements aux freelances) ─────────────

export async function createPayout(input: {
  amountXof: number;
  mode: string;
  customer: FedapayCustomer & { phone_number: { number: string; country: string } };
  merchantReference: string;
}) {
  const data = await request<unknown>("POST", "/payouts", {
    amount: input.amountXof,
    currency: { iso: config.fedapay.currency },
    mode: input.mode,
    customer: input.customer,
    merchant_reference: input.merchantReference,
  });
  return unwrap<FedapayPayout>(data, "payout");
}

export async function startPayout(payoutId: number | string) {
  const data = await request<unknown>("PUT", "/payouts/start", { payouts: [{ id: Number(payoutId) }] });
  const list = unwrap<FedapayPayout[] | { payouts?: FedapayPayout[] }>(data, "payouts");
  const payouts = Array.isArray(list) ? list : (list.payouts ?? []);
  return payouts[0] ?? null;
}

export async function retrievePayout(payoutId: number | string) {
  const data = await request<unknown>("GET", `/payouts/${payoutId}`);
  return unwrap<FedapayPayout>(data, "payout");
}

export function mapPayoutStatus(status: string): "SENT" | "FAILED" | "PROCESSING" {
  const s = status.toLowerCase();
  if (s === "sent") return "SENT";
  if (s === "failed") return "FAILED";
  return "PROCESSING";
}

// ───────────── Vérification de la connexion ─────────────

export type FedapayBalance = { id: number; amount: number; mode?: string | null };

/**
 * Appel en lecture seule (GET /v1/balances) : vérifie que la clé secrète est acceptée
 * et renvoie les soldes du compte. Ne crée ni transaction ni reversement.
 */
export async function checkConnection() {
  const data = await request<unknown>("GET", "/balances");
  const list = unwrap<FedapayBalance[] | { balances?: FedapayBalance[] }>(data, "balances");
  return Array.isArray(list) ? list : (list.balances ?? []);
}

// ───────────── Webhooks ─────────────

/**
 * Vérifie l'en-tête X-FEDAPAY-SIGNATURE : « t=<timestamp>,s=<signature> »,
 * signature = HMAC-SHA256(`${t}.${corps brut}`, secret du webhook). Tolérance : 5 minutes.
 */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header || !secret) return false;
  let timestamp = -1;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k?.trim() === "t") timestamp = Number.parseInt(v ?? "", 10);
    if (k?.trim() === "s" && v) signatures.push(v.trim());
  }
  if (timestamp < 0 || signatures.length === 0) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected);
  const match = signatures.some((sig) => {
    const buf = Buffer.from(sig);
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
  if (!match) return false;

  const age = Math.floor(Date.now() / 1000) - timestamp;
  return age <= toleranceSec;
}
