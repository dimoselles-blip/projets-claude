import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { MISSION_STATUS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { formatDate, cn } from "@/lib/utils";
import { moderateMissionAction } from "@/server/actions/admin";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import type { MissionStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Missions" };

const TABS: { key: MissionStatus; label: string }[] = [
  { key: "PENDING_REVIEW", label: "À valider" },
  { key: "OPEN", label: "Ouvertes" },
  { key: "IN_PROGRESS", label: "En cours" },
  { key: "COMPLETED", label: "Terminées" },
  { key: "REJECTED", label: "Refusées" },
  { key: "CANCELLED", label: "Annulées" },
];

export default async function AdminMissionsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin();
  const { statut } = await searchParams;
  const status = TABS.find((t) => t.key === statut)?.key ?? "PENDING_REVIEW";
  const missions = await prisma.mission.findMany({
    where: { status },
    include: { category: true, client: { select: { name: true, email: true, clientProfile: { select: { companyName: true } } } }, _count: { select: { applications: true } } },
    orderBy: { createdAt: status === "PENDING_REVIEW" ? "asc" : "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Missions" description="Validez les missions publiées par les clients avant leur diffusion aux freelances." />
      <div className="scrollbar-none mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/missions?statut=${t.key}`} className={cn("shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium", t.key === status ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100")}>
            {t.label}
          </Link>
        ))}
      </div>
      {missions.length === 0 ? (
        <EmptyState title="Rien à afficher" />
      ) : (
        <ul className="space-y-4">
          {missions.map((m) => (
            <li key={m.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={m.status} map={MISSION_STATUS} />
                <span className="text-xs text-ink-500">
                  {m.category.name} · {formatDate(m.createdAt, true)} · {m._count.applications} candidature(s)
                </span>
              </div>
              <p className="mt-1.5 font-semibold">{m.title}</p>
              <p className="text-sm text-ink-500">
                {m.client.clientProfile?.companyName ?? m.client.name} · {m.client.email} · budget {m.budgetMinXof ? `${formatXof(m.budgetMinXof)} – ` : "≤ "}
                {formatXof(m.budgetMaxXof)}
              </p>
              <p className="mt-2 line-clamp-4 text-sm whitespace-pre-line text-ink-700">{m.description}</p>
              {(m.status === "PENDING_REVIEW" || m.status === "OPEN") && (
                <form action={moderateMissionAction} className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:items-center">
                  <input type="hidden" name="id" value={m.id} />
                  <input name="reason" placeholder="Motif (obligatoire pour un refus)" className="h-9 flex-1 rounded-lg border border-ink-200 px-3 text-sm" />
                  <div className="flex gap-2">
                    {m.status === "PENDING_REVIEW" && (
                      <SubmitButton name="decision" value="approve" variant="success" size="sm">
                        Publier
                      </SubmitButton>
                    )}
                    <SubmitButton name="decision" value="reject" variant="outline" size="sm">
                      {m.status === "OPEN" ? "Retirer" : "Refuser"}
                    </SubmitButton>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
