import Link from "next/link";
import { CalendarClock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/Price";
import { formatDate, formatRelative } from "@/lib/utils";
import type { MissionCardData } from "@/lib/queries";

export function MissionCard({ mission }: { mission: MissionCardData }) {
  return (
    <Link
      href={`/missions/${mission.id}`}
      className="group block rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:border-brand-200 hover:shadow-card-hover sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <Badge tone="brand">{mission.category.name}</Badge>
        <span>Publiée {formatRelative(mission.publishedAt ?? mission.createdAt)}</span>
        <span>·</span>
        <span>{mission.client.clientProfile?.companyName ?? mission.client.name}</span>
      </div>
      <h3 className="mt-3 font-sans text-lg font-semibold text-ink-900 group-hover:text-brand-700">{mission.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">{mission.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-semibold text-ink-900">
          Budget : {mission.budgetMinXof ? <><Price xof={mission.budgetMinXof} /> – </> : "jusqu'à "}
          <Price xof={mission.budgetMaxXof} />
        </span>
        {mission.deadline && (
          <span className="inline-flex items-center gap-1.5 text-ink-500">
            <CalendarClock className="size-4" /> Avant le {formatDate(mission.deadline)}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-ink-500">
          <Users className="size-4" /> {mission._count.applications} candidature{mission._count.applications > 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
