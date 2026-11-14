import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Price } from "@/components/Price";
import type { ServiceCardData } from "@/lib/queries";

const gradients = [
  "from-brand-700 via-brand-600 to-brand-400",
  "from-ink-900 via-brand-900 to-brand-600",
  "from-brand-900 via-brand-700 to-accent-500",
  "from-ink-800 via-ink-700 to-brand-500",
];

export function ServiceCover({ service, className = "" }: { service: Pick<ServiceCardData, "id" | "title" | "coverUrl" | "category">; className?: string }) {
  if (service.coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={service.coverUrl} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  const icon = service.category.icon ?? service.category.parent?.icon;
  const g = gradients[service.id.charCodeAt(service.id.length - 1) % gradients.length];
  return (
    <div className={`relative grid h-full w-full place-items-center bg-gradient-to-br ${g} ${className}`}>
      <CategoryIcon name={icon} className="size-12 text-white/80" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}

export function ServiceCard({ service }: { service: ServiceCardData }) {
  const from = service.packages[0];
  const profile = service.freelancer.freelancerProfile;
  const minDays = Math.min(...service.packages.map((p) => p.deliveryDays));
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <ServiceCover service={service} className="transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Avatar name={service.freelancer.name} src={profile?.avatarUrl} size={26} />
          <span className="truncate text-sm font-medium text-ink-800">{service.freelancer.name}</span>
          {profile?.isVerified && <BadgeCheck className="size-4 shrink-0 text-brand-600" aria-label="Profil vérifié" />}
        </div>
        <h3 className="mt-2.5 line-clamp-2 font-sans text-[15px] leading-snug font-medium text-ink-900 group-hover:text-brand-700">{service.title}</h3>
        <p className="mt-1.5 text-xs text-ink-500">{service.category.parent ? `${service.category.parent.name} · ${service.category.name}` : service.category.name}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <span className="inline-flex items-center gap-1 text-xs text-ink-500">
            <Clock className="size-3.5" /> {Number.isFinite(minDays) ? `${minDays} j` : "—"}
          </span>
          {from && (
            <span className="text-right">
              <span className="block text-[11px] tracking-wide text-ink-400 uppercase">À partir de</span>
              <Price xof={from.priceXof} className="font-display text-lg font-bold text-ink-900" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
