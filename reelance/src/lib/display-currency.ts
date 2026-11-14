import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getRates } from "@/lib/rates";
import { convertFromXof, currencyForCountry, formatMoney, isCurrency, type CurrencyCode } from "@/lib/currency";

export const CURRENCY_COOKIE = "rl_currency";

/** Devise d'affichage : préférence du compte > cookie > pays détecté (en-tête géo) > FCFA. */
export const getDisplayCurrency = cache(async (): Promise<CurrencyCode> => {
  const user = await getCurrentUser();
  if (user && isCurrency(user.currency)) return user.currency;
  const fromCookie = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (isCurrency(fromCookie)) return fromCookie;
  const h = await headers();
  return currencyForCountry(h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry"));
});

export const getCurrencyContext = cache(async () => {
  const [currency, rates] = await Promise.all([getDisplayCurrency(), getRates()]);
  return {
    currency,
    rates,
    format: (xof: number) => formatMoney(convertFromXof(xof, currency, rates), currency),
    convert: (xof: number) => convertFromXof(xof, currency, rates),
  };
});
