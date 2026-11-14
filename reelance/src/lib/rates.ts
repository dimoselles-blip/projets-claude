import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode, type RateTable } from "@/lib/currency";

/**
 * Valeurs de secours (FCFA pour 1 unité) utilisées uniquement si l'API de change
 * est injoignable ET qu'aucun taux n'a encore été enregistré en base.
 */
const FALLBACK_XOF_PER_UNIT: Record<CurrencyCode, number> = {
  XOF: 1,
  XAF: 1,
  EUR: 655.957,
  USD: 565,
  CAD: 410,
  GBP: 760,
  CHF: 700,
};

/**
 * Récupère les taux depuis l'API configurée (par défaut open.er-api.com, gratuite, sans clé).
 * La réponse attendue est de la forme { rates: { EUR: 0.0015, USD: 0.0017, ... } } avec XOF pour base.
 */
export async function refreshExchangeRates() {
  const res = await fetch(config.exchangeRates.apiUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`API de change : HTTP ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, number> };
  if (!data.rates) throw new Error("API de change : réponse sans champ rates");

  const updated: string[] = [];
  for (const code of CURRENCY_CODES) {
    const fixed = CURRENCIES[code].fixedXofPerUnit;
    let xofPerUnit: number | null = fixed;
    if (fixed === null) {
      const perXof = data.rates[code];
      if (!perXof || perXof <= 0) continue;
      xofPerUnit = 1 / perXof;
    }
    await prisma.exchangeRate.upsert({
      where: { currency: code },
      create: { currency: code, xofPerUnit: xofPerUnit!, source: fixed === null ? "api" : "parité fixe" },
      update: { xofPerUnit: xofPerUnit!, source: fixed === null ? "api" : "parité fixe" },
    });
    updated.push(code);
  }
  return updated;
}

let lastAttempt = 0;
const RETRY_AFTER_MS = 10 * 60 * 1000;

/** Rafraîchit les taux au plus une fois toutes les 10 minutes ; en cas d'échec, complète la table avec les valeurs de secours. */
async function tryRefresh() {
  if (Date.now() - lastAttempt < RETRY_AFTER_MS) return;
  lastAttempt = Date.now();
  try {
    await refreshExchangeRates();
  } catch (err) {
    console.warn("[rates] API de change injoignable, valeurs de secours utilisées :", err instanceof Error ? err.message : err);
    await prisma.exchangeRate.createMany({
      data: CURRENCY_CODES.map((code) => ({
        currency: code,
        xofPerUnit: FALLBACK_XOF_PER_UNIT[code],
        source: CURRENCIES[code].fixedXofPerUnit === null ? "valeur de secours" : "parité fixe",
      })),
      skipDuplicates: true,
    });
  }
}

async function loadRates(): Promise<RateTable> {
  let rows = await prisma.exchangeRate.findMany();
  if (rows.length < CURRENCY_CODES.length) {
    // Première utilisation : on attend le premier chargement.
    await tryRefresh();
    rows = await prisma.exchangeRate.findMany();
  } else {
    const oldest = rows.reduce((min, r) => (r.updatedAt < min ? r.updatedAt : min), rows[0]!.updatedAt);
    if (Date.now() - oldest.getTime() > config.exchangeRates.ttlHours * 3600 * 1000) {
      // Taux périmés : on sert les derniers connus et on rafraîchit en arrière-plan.
      void tryRefresh();
    }
  }

  const table = { ...FALLBACK_XOF_PER_UNIT };
  for (const row of rows) {
    if (row.currency in table) table[row.currency as CurrencyCode] = Number(row.xofPerUnit);
  }
  // Les parités fixes priment toujours.
  for (const code of CURRENCY_CODES) {
    const fixed = CURRENCIES[code].fixedXofPerUnit;
    if (fixed !== null) table[code] = fixed;
  }
  return table;
}

/** Table des taux, mise en cache pour la durée d'une requête. */
export const getRates = cache(loadRates);
