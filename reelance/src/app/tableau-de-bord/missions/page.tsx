import type { Metadata } from "next";
import Link from "next/link";
import { FileText, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { MISSION_STATUS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Mes missions" };

export default async function MyMissionsPage() {
  const user = await requireUser(["CLIENT"]);
  const missions = await prisma.mission.findMany({
    where: { clientId: user.id },
    include: { category: true, _count: { select: { applications: { where: { status: { not: "WITHDRAWN" } } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Mes missions"
        description="Publiez un besoin, recevez des devis, choisissez votre monteur."
        actions={
          <LinkButton href="/tableau-de-bord/missions/nouvelle">
            <PlusCircle className="size-4" /> Publier une mission
          </LinkButton>
        }
      />
      {missions.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="Aucune mission publiée"
          description="Décrivez votre projet vidéo et votre budget : les monteurs intéressés vous envoient leur devis."
          action={<LinkButton href="/tableau-de-bord/missions/nouvelle">Publier ma première mission</LinkButton>}
        />
      ) : (
        <ul className="space-y-3">
          {missions.map((m) => (
            <li key={m.id}>
              <Link href={`/tableau-de-bord/missions/${m.id}`} className="block rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:shadow-card-hover">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{m.title}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {m.category.name} · budget max {formatXof(m.budgetMaxXof)} · créée le {formatDate(m.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={m.status} map={MISSION_STATUS} />
                </div>
                <p className="mt-3 text-sm font-medium text-brand-700">{m._count.applications} candidature(s) →</p>
                {m.status === "REJECTED" && m.rejectionReason && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Motif du refus : {m.rejectionReason}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
