import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { APPLICATION_STATUS, MISSION_STATUS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { acceptApplicationAction, cancelMissionAction, rejectApplicationAction } from "@/server/actions/missions";
import { PageHeader, Avatar, EmptyState } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Price } from "@/components/Price";

export const metadata: Metadata = { title: "Mission" };

export default async function MyMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CLIENT"]);
  const { id } = await params;
  const mission = await prisma.mission.findFirst({
    where: { id, clientId: user.id },
    include: {
      category: true,
      orders: { where: { status: { not: "CANCELLED" } }, select: { id: true, status: true, freelancer: { select: { name: true } } } },
      applications: {
        where: { status: { not: "WITHDRAWN" } },
        orderBy: { createdAt: "asc" },
        include: {
          freelancer: {
            select: {
              name: true,
              freelancerProfile: { select: { slug: true, headline: true, avatarUrl: true, isVerified: true, skills: true } },
              _count: { select: { freelancerOrders: { where: { status: "COMPLETED" } } } },
            },
          },
        },
      },
    },
  });
  if (!mission) notFound();
  const activeOrder = mission.orders[0];
  const canChoose = mission.status === "OPEN" && !activeOrder;

  return (
    <>
      <PageHeader
        title={mission.title}
        description={`${mission.category.name} · budget ${mission.budgetMinXof ? `${formatXof(mission.budgetMinXof)} – ` : "jusqu'à "}${formatXof(mission.budgetMaxXof)}${mission.deadline ? ` · échéance ${formatDate(mission.deadline)}` : ""}`}
        actions={
          <>
            <StatusBadge status={mission.status} map={MISSION_STATUS} />
            {mission.status === "OPEN" && (
              <LinkButton href={`/missions/${mission.id}`} variant="outline" size="sm">
                Annonce publique <ExternalLink className="size-3.5" />
              </LinkButton>
            )}
          </>
        }
      />

      {mission.status === "PENDING_REVIEW" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Votre mission est en cours de validation par l&apos;équipe Reelance.</div>
      )}
      {mission.status === "REJECTED" && mission.rejectionReason && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Mission refusée : {mission.rejectionReason}</div>
      )}
      {activeOrder && (
        <Card className="mb-6 border-brand-200">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Mission confiée à <strong>{activeOrder.freelancer.name}</strong>.{" "}
              {activeOrder.status === "AWAITING_PAYMENT" ? "Réglez la commande pour démarrer." : "Suivez l'avancement dans la commande."}
            </p>
            <LinkButton href={`/tableau-de-bord/commandes/${activeOrder.id}`} size="sm">
              {activeOrder.status === "AWAITING_PAYMENT" ? "Payer et démarrer" : "Voir la commande"}
            </LinkButton>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title={`Candidatures (${mission.applications.length})`} description={canChoose ? "Comparez les devis et les profils, puis retenez un monteur. Vous paierez ensuite en toute sécurité." : undefined} />
        {mission.applications.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Pas encore de candidature" description="Les monteurs sont prévenus des nouvelles missions. Revenez d'ici quelques heures." />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {mission.applications.map((a) => {
              const p = a.freelancer.freelancerProfile;
              return (
                <li key={a.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-start gap-3">
                    <Avatar name={a.freelancer.name} src={p?.avatarUrl} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/freelances/${p?.slug}`} className="flex items-center gap-1 font-semibold hover:text-brand-700">
                          {a.freelancer.name} {p?.isVerified && <BadgeCheck className="size-4 text-brand-600" />}
                        </Link>
                        <StatusBadge status={a.status} map={APPLICATION_STATUS} />
                      </div>
                      <p className="text-sm text-ink-500">
                        {p?.headline} · {a.freelancer._count.freelancerOrders} commande(s) terminée(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <Price xof={a.priceXof} className="font-display text-lg font-bold" />
                      <p className="text-xs text-ink-500">en {a.deliveryDays} jour(s)</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-700">{a.coverLetter}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <LinkButton href={`/freelances/${p?.slug}`} variant="outline" size="sm">
                      Voir le portfolio
                    </LinkButton>
                    {canChoose && a.status === "PENDING" && (
                      <>
                        <form action={acceptApplicationAction}>
                          <input type="hidden" name="applicationId" value={a.id} />
                          <SubmitButton size="sm" confirm={`Retenir ${a.freelancer.name} pour cette mission ?`}>
                            Retenir ce freelance
                          </SubmitButton>
                        </form>
                        <form action={rejectApplicationAction}>
                          <input type="hidden" name="applicationId" value={a.id} />
                          <SubmitButton size="sm" variant="ghost">
                            Écarter
                          </SubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {(mission.status === "OPEN" || mission.status === "PENDING_REVIEW") && !activeOrder && (
        <form action={cancelMissionAction} className="mt-6">
          <input type="hidden" name="id" value={mission.id} />
          <SubmitButton variant="ghost" size="sm" className="text-red-600" confirm="Annuler cette mission ?">
            Annuler la mission
          </SubmitButton>
        </form>
      )}
    </>
  );
}
