/**
 * Devises d'affichage. Le prix de référence est toujours saisi en FCFA (XOF) ;
 * l'EUR et le XAF ont une parité fixe avec le XOF, les autres devises utilisent
 * un taux mis à jour régulièrement (voir rates.ts).
 */

export const BASE_CURRENCY = "XOF";

export const CURRENCIES = {
  XOF: { label: "Franc CFA (BCEAO)", short: "FCFA", decimals: 0, fixedXofPerUnit: 1 },
  XAF: { label: "Franc CFA (BEAC)", short: "FCFA", decimals: 0, fixedXofPerUnit: 1 },
  EUR: { label: "Euro", short: "€", decimals: 2, fixedXofPerUnit: 655.957 },
  USD: { label: "Dollar américain", short: "$", decimals: 2, fixedXofPerUnit: null },
  CAD: { label: "Dollar canadien", short: "$ CA", decimals: 2, fixedXofPerUnit: null },
  GBP: { label: "Livre sterling", short: "£", decimals: 2, fixedXofPerUnit: null },
  CHF: { label: "Franc suisse", short: "CHF", decimals: 2, fixedXofPerUnit: null },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrency(code: unknown): code is CurrencyCode {
  return typeof code === "string" && code in CURRENCIES;
}

/** Taux : combien de FCFA vaut 1 unité de chaque devise. */
export type RateTable = Record<CurrencyCode, number>;

export function convertFromXof(amountXof: number, currency: CurrencyCode, rates: RateTable) {
  const rate = rates[currency];
  const value = amountXof / rate;
  const decimals = CURRENCIES[currency].decimals;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatMoney(amount: number, currency: CurrencyCode | string) {
  const code = isCurrency(currency) ? currency : "XOF";
  const { decimals } = CURRENCIES[code];
  if (code === "XOF" || code === "XAF") {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatXof(amountXof: number) {
  return formatMoney(amountXof, "XOF");
}

/** Devise suggérée à un visiteur selon son pays (en-tête géo de Vercel/Cloudflare). */
export function currencyForCountry(country: string | null | undefined): CurrencyCode {
  if (!country) return "XOF";
  const c = country.toUpperCase();
  const eurozone = ["FR", "BE", "DE", "ES", "IT", "PT", "NL", "LU", "IE", "AT", "FI", "GR", "MC", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR"];
  if (eurozone.includes(c)) return "EUR";
  if (["CM", "GA", "CG", "TD", "CF", "GQ"].includes(c)) return "XAF";
  if (c === "US") return "USD";
  if (c === "CA") return "CAD";
  if (c === "GB") return "GBP";
  if (c === "CH") return "CHF";
  return "XOF";
}
