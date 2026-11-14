"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type PackageView = {
  tier: string;
  label: string;
  name: string;
  description: string;
  price: string;
  priceBase: string | null;
  deliveryDays: number;
  revisions: number;
  features: string[];
};

export function PackageSelector({ packages, orderHref, canOrder, reason }: { packages: PackageView[]; orderHref: string; canOrder: boolean; reason?: string }) {
  const [active, setActive] = useState(packages.length > 1 ? 1 : 0);
  const pkg = packages[active] ?? packages[0];
  if (!pkg) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      {packages.length > 1 && (
        <div className="grid border-b border-ink-100" style={{ gridTemplateColumns: `repeat(${packages.length}, 1fr)` }} role="tablist">
          {packages.map((p, i) => (
            <button
              key={p.tier}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "relative py-3.5 text-sm font-semibold transition",
                i === active ? "text-ink-950" : "text-ink-500 hover:text-ink-800",
              )}
            >
              {p.label}
              {i === active && <span className="absolute inset-x-4 bottom-0 h-1 rounded-full bg-brand-400" />}
            </button>
          ))}
        </div>
      )}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-ink-900">{pkg.name}</p>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-ink-900">{pkg.price}</p>
            {pkg.priceBase && <p className="text-xs text-ink-500">soit {pkg.priceBase}</p>}
          </div>
        </div>
        {pkg.description && <p className="mt-2 text-sm leading-relaxed text-ink-600">{pkg.description}</p>}
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-ink-700">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-ink-400" /> Livraison en {pkg.deliveryDays} jour{pkg.deliveryDays > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="size-4 text-ink-400" /> {pkg.revisions} retouche{pkg.revisions > 1 ? "s" : ""}
          </span>
        </div>
        {pkg.features.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            {pkg.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {f}
              </li>
            ))}
          </ul>
        )}
        {canOrder ? (
          <Link
            href={`${orderHref}?offre=${pkg.tier}`}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-400 font-semibold text-ink-950 hover:bg-brand-300"
          >
            Commander ({pkg.price}) <ArrowRight className="size-4" />
          </Link>
        ) : (
          <p className="mt-6 rounded-xl bg-ink-50 px-4 py-3 text-center text-sm text-ink-600">{reason}</p>
        )}
        <p className="mt-3 text-center text-xs text-ink-500">Paiement sécurisé : les fonds sont bloqués jusqu&apos;à votre validation.</p>
      </div>
    </div>
  );
}
