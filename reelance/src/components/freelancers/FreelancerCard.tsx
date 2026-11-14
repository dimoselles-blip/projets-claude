import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/Price";
import { COUNTRIES } from "@/lib/constants";
import type { FreelancerCardData } from "@/lib/queries";

export function FreelancerCard({ freelancer }: { freelancer: FreelancerCardData }) {
  const p = freelancer.freelancerProfile;
  if (!p) return null;
  const prices = freelancer.services.flatMap((s) => s.packages.map((pk) => pk.priceXof));
  const from = prices.length ? Math.min(...prices) : null;
  const categories = [...new Set(freelancer.services.map((s) => s.category.name))].slice(0, 2);

  return (
    <Link
      href={`/freelances/${p.slug}`}
      className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={freelancer.name} src={p.avatarUrl} size={56} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold text-ink-900">
            <span className="truncate">{freelancer.name}</span>
            {p.isVerified && <BadgeCheck className="size-4 shrink-0 fill-brand-400 text-ink-950" aria-label="Profil vérifié" />}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-600">{p.headline}</p>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
            <MapPin className="size-3.5" /> {[p.city, COUNTRIES[p.country] ?? p.country].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>
      {p.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md bg-ink-50 px-2 py-1 text-xs text-ink-700">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 pt-4 mt-5">
        <div className="flex flex-wrap gap-1.5">
          {p.isAvailable ? <Badge tone="success">Disponible</Badge> : <Badge>Indisponible</Badge>}
          {categories.map((c) => (
            <Badge key={c} tone="brand" className="hidden sm:inline-flex">
              {c}
            </Badge>
          ))}
        </div>
        {from !== null && (
          <span className="text-right text-sm text-ink-500">
            dès <Price xof={from} className="font-semibold text-ink-900" />
          </span>
        )}
      </div>
    </Link>
  );
}
