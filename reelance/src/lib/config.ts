/**
 * Configuration centralisée, lue depuis les variables d'environnement.
 * Voir `.env.example` pour la liste complète et la documentation de chaque variable.
 */

function bool(value: string | undefined, fallback = false) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function num(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && value !== undefined && value !== "" ? n : fallback;
}

/** Mode déduit du préfixe de la clé secrète (sk_live_… / sk_sandbox_…). */
const fedapayKeyEnv = (process.env.FEDAPAY_SECRET_KEY ?? "").startsWith("sk_live_")
  ? "live"
  : (process.env.FEDAPAY_SECRET_KEY ?? "").startsWith("sk_sandbox_")
    ? "sandbox"
    : null;
// FEDAPAY_ENV prime s'il est renseigné ; sinon on suit la clé (sandbox par défaut).
const fedapayEnv = process.env.FEDAPAY_ENV
  ? process.env.FEDAPAY_ENV.toLowerCase() === "live"
    ? "live"
    : "sandbox"
  : (fedapayKeyEnv ?? "sandbox");

export const config = {
  appName: "Reelance",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  isProduction: process.env.NODE_ENV === "production",

  session: {
    cookieName: "rl_session",
    maxAgeDays: num(process.env.SESSION_MAX_AGE_DAYS, 30),
  },

  fedapay: {
    env: fedapayEnv as "sandbox" | "live",
    /** Mode correspondant à la clé secrète, pour détecter une incohérence avec FEDAPAY_ENV. */
    keyEnv: fedapayKeyEnv as "sandbox" | "live" | null,
    apiBase:
      process.env.FEDAPAY_API_BASE ??
      (fedapayEnv === "live" ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com"),
    secretKey: process.env.FEDAPAY_SECRET_KEY ?? "",
    publicKey: process.env.FEDAPAY_PUBLIC_KEY ?? "",
    webhookSecret: process.env.FEDAPAY_WEBHOOK_SECRET ?? "",
    /** FedaPay encaisse en FCFA (XOF). */
    currency: "XOF",
  },

  /**
   * Mode démo : simule le paiement sans appeler FedaPay (développement uniquement).
   * Toujours désactivé en mode live.
   */
  paymentSimulation: bool(process.env.PAYMENT_SIMULATION) && fedapayEnv !== "live",

  cron: {
    secret: process.env.CRON_SECRET ?? "",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "reelance",
  },

  mail: {
    host: process.env.SMTP_HOST ?? "",
    port: num(process.env.SMTP_PORT, 465),
    secure: bool(process.env.SMTP_SECURE, true),
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    from: process.env.MAIL_FROM ?? "Reelance <no-reply@reelance.com>",
  },

  exchangeRates: {
    apiUrl: process.env.EXCHANGE_RATE_API_URL ?? "https://open.er-api.com/v6/latest/XOF",
    ttlHours: num(process.env.EXCHANGE_RATE_TTL_HOURS, 12),
  },
} as const;

export const isCloudinaryConfigured = () =>
  Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);

export const isFedapayConfigured = () => Boolean(config.fedapay.secretKey);
