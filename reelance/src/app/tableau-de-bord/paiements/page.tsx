import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Lock, Wallet, WalletCards } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { ESCROW_STATUS, PAYOUT_OPERATORS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { PageHeader, Stat, EmptyState, Table, Th, Td } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Paiements" };

export default async function EarningsPage() {
  const user = await requireUser(["FREELANCER"]);
  const profile = user.freelancerProfile!;
  const escrows = await prisma.escrow.findMany({
    where: { order: { freelancerId: user.id } },
    include: { order: { select: { id: true, reference: true, title: true } }, payouts: { where: { status: "SENT" }, take: 1 } },
    orderBy: { heldAt: "desc" },
  });
  const total = (statuses: string[]) => escrows.filter((e) => statuses.includes(e.status)).reduce((s, e) => s + e.freelancerNetXof, 0);
  const operator = profile.payoutOperator ? PAYOUT_OPERATORS[profile.payoutOperator] : null;

  return (
    <>
      <PageHeader title="Paiements" description="Suivez l'argent de vos commandes, du séquestre jusqu'à votre compte Mobile Money." />
      {!profile.payoutPhone && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert className="size-5 shrink-0" />
          <p>
            Renseignez votre compte Mobile Money pour recevoir vos paiements.{" "}
            <Link href="/tableau-de-bord/profil#paiements" className="font-semibold underline">
              Ajouter mon compte
            </Link>
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="En séquestre" value={formatXof(total(["HELD"]))} icon={<Lock className="size-5" />} hint="Commandes en cours, payées par le client" />
        <Stat label="À recevoir" value={formatXof(total(["RELEASABLE", "RELEASING"]))} icon={<WalletCards className="size-5" />} hint="Validées, reversement en préparation" />
        <Stat label="Reçu" value={formatXof(total(["RELEASED"]))} icon={<Wallet className="size-5" />} hint={operator ? `Sur ${operator.label} · ${profile.payoutPhone}` : undefined} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Détail par commande" description="Montants nets, après commission Reelance." />
        {escrows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Wallet className="size-5" />} title="Aucun paiement pour l'instant" />
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Commande</Th>
                <Th>Payée le</Th>
                <Th>Net</Th>
                <Th>Statut</Th>
                <Th>Reversée le</Th>
              </tr>
            </thead>
            <tbody>
              {escrows.map((e) => (
                <tr key={e.id}>
                  <Td>
                    <Link href={`/tableau-de-bord/commandes/${e.order.id}`} className="font-medium decoration-brand-400 decoration-[3px] underline-offset-4 hover:underline">
                      {e.order.title}
                    </Link>
                    <p className="text-xs text-ink-500">{e.order.reference}</p>
                  </Td>
                  <Td>{formatDate(e.heldAt)}</Td>
                  <Td className="font-semibold">{formatXof(e.freelancerNetXof)}</Td>
                  <Td>
                    <StatusBadge status={e.status} map={ESCROW_STATUS} />
                  </Td>
                  <Td>{formatDate(e.payouts[0]?.sentAt ?? e.releasedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
