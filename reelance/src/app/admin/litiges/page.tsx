import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { DISPUTE_STATUS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Litiges" };

export default async function AdminDisputesPage() {
  await requireAdmin();
  const disputes = await prisma.dispute.findMany({
    include: { openedBy: { select: { name: true, role: true } }, order: { select: { id: true, reference: true, title: true, priceXof: true, client: { select: { name: true } }, freelancer: { select: { name: true } } } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <>
      <PageHeader title="Litiges" description="Examinez la commande (consignes, livraisons, historique) puis tranchez : payer le freelance ou rembourser le client." />
      {disputes.length === 0 ? (
        <EmptyState icon={<Scale className="size-5" />} title="Aucun litige" description="Tant mieux !" />
      ) : (
        <ul className="space-y-3">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {d.order.reference} · {d.order.title}
                  </p>
                  <p className="text-sm text-ink-500">
                    {d.order.client.name} ↔ {d.order.freelancer.name} · {formatXof(d.order.priceXof)} · ouvert le {formatDate(d.createdAt, true)} par {d.openedBy.name} (
                    {d.openedBy.role === "CLIENT" ? "client" : "freelance"})
                  </p>
                </div>
                <StatusBadge status={d.status} map={DISPUTE_STATUS} />
              </div>
              <p className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">{d.reason}</p>
              {d.resolutionNote && <p className="mt-2 text-sm text-ink-600">Décision : {d.resolutionNote}</p>}
              <div className="mt-3">
                <LinkButton href={`/admin/commandes/${d.order.id}`} size="sm" variant={d.status === "OPEN" ? "primary" : "outline"}>
                  {d.status === "OPEN" ? "Examiner et trancher" : "Voir la commande"}
                </LinkButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-ink-500">
        Un remboursement client se fait depuis votre <Link href="https://live.fedapay.com" className="underline">tableau de bord FedaPay</Link> ; Reelance enregistre la décision et clôt le séquestre.
      </p>
    </>
  );
}
