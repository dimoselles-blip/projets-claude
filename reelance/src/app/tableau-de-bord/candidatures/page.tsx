import type { Metadata } from "next";
import Link from "next/link";
import { Send } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { APPLICATION_STATUS, MISSION_STATUS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { withdrawApplicationAction } from "@/server/actions/missions";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Mes candidatures" };

export default async function ApplicationsPage() {
  const user = await requireUser(["FREELANCER"]);
  const applications = await prisma.application.findMany({
    where: { freelancerId: user.id },
    include: { mission: { include: { client: { select: { clientProfile: { select: { companyName: true } }, name: true } } } }, order: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Mes candidatures" description="Les missions auxquelles vous avez postulé." actions={<LinkButton href="/missions">Trouver des missions</LinkButton>} />
      {applications.length === 0 ? (
        <EmptyState icon={<Send className="size-5" />} title="Aucune candidature" description="Parcourez les missions ouvertes et envoyez votre devis." action={<LinkButton href="/missions">Voir les missions</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {applications.map((a) => (
            <li key={a.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/missions/${a.missionId}`} className="font-semibold hover:text-brand-700">
                    {a.mission.title}
                  </Link>
                  <p className="mt-1 text-sm text-ink-500">
                    {a.mission.client.clientProfile?.companyName ?? a.mission.client.name} · envoyée le {formatDate(a.createdAt)} · mission{" "}
                    {MISSION_STATUS[a.mission.status].label.toLowerCase()}
                  </p>
                </div>
                <StatusBadge status={a.status} map={APPLICATION_STATUS} />
              </div>
              <p className="mt-3 text-sm">
                Votre devis : <strong>{formatXof(a.priceXof)}</strong> · {a.deliveryDays} jour(s)
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.order && (
                  <LinkButton href={`/tableau-de-bord/commandes/${a.order.id}`} size="sm">
                    Voir la commande
                  </LinkButton>
                )}
                {a.status === "PENDING" && (
                  <form action={withdrawApplicationAction}>
                    <input type="hidden" name="applicationId" value={a.id} />
                    <SubmitButton variant="ghost" size="sm" confirm="Retirer cette candidature ?">
                      Retirer
                    </SubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
