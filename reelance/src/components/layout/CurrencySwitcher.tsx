"use client";

import { useRef } from "react";
import { setCurrencyAction } from "@/server/actions/currency";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ current, className }: { current: CurrencyCode; className?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={setCurrencyAction} className={className}>
      <label className="sr-only" htmlFor="currency-switcher">
        Devise d&apos;affichage
      </label>
      <select
        id="currency-switcher"
        name="currency"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className={cn(
          "h-9 cursor-pointer rounded-lg border border-ink-200 bg-white pr-2 pl-2.5 text-sm font-medium text-ink-700 hover:border-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-200",
        )}
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {code === "XOF" || code === "XAF" ? `${CURRENCIES[code].short} (${code})` : `${CURRENCIES[code].short} ${code}`}
          </option>
        ))}
      </select>
    </form>
  );
}
