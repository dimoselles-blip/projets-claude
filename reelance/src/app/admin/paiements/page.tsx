import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { config, isFedapayConfigured } from "@/lib/config";
import { ESCROW_STATUS, PAYMENT_STATUS, PAYOUT_OPERATORS, PAYOUT_STATUS } from "@/lib/constants";
import { formatMoney, formatXof } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { manualPayoutAction, refreshPayoutAction, startPayoutAction } from "@/server/actions/admin";
import { PageHeader, Table, Th, Td, Stat } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Paiements & séquestre" };

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const escrowInclude = {
    order: { select: { id: true, reference: true, title: true, freelancer: { select: { name: true, freelancerProfile: { select: { payoutOperator: true, payoutPhone: true } } } } } },
    payouts: { orderBy: { createdAt: "desc" as const }, take: 1 },
  };
  const [releasable, releasing, held, payouts, payments, latePayments] = await Promise.all([
    prisma.escrow.findMany({ where: { status: "RELEASABLE" }, include: escrowInclude, orderBy: { releasableAt: "asc" } }),
    prisma.escrow.findMany({ where: { status: "RELEASING" }, include: escrowInclude }),
    prisma.escrow.aggregate({ where: { status: "HELD" }, _sum: { amountXof: true }, _count: true }),
    prisma.payout.findMany({ include: { freelancer: { select: { name: true } }, escrow: { select: { order: { select: { id: true, reference: true } } } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.payment.findMany({ include: { order: { select: { id: true, reference: true, displayCurrency: true, displayAmount: true, client: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.orderEvent.findMany({ where: { type: "PAYMENT_LATE" }, include: { order: { select: { id: true, reference: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const toRelease = releasable.reduce((s, e) => s + e.freelancerNetXof, 0);

  return (
    <>
      <PageHeader title="Paiements & séquestre" description="Encaissements FedaPay, fonds bloqués et reversements aux freelances." />
      {!isFedapayConfigured() && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert className="size-5 shrink-0" />
          <p>
            Les clés FedaPay ne sont pas configurées{config.paymentSimulation ? " : le mode démo simule paiements et reversements." : "."} Renseignez FEDAPAY_SECRET_KEY et FEDAPAY_WEBHOOK_SECRET dans le fichier .env.
          </p>
        </div>
      )}
      {latePayments.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Paiements reçus après annulation (à rembourser depuis FedaPay)</p>
          <ul className="mt-2 list-disc pl-5">
            {latePayments.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/commandes/${e.order.id}`} className="underline">
                  {e.order.reference}
                </Link>{" "}
                — {formatDate(e.createdAt, true)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="En séquestre" value={formatXof(held._sum.amountXof ?? 0)} hint={`${held._count} commande(s) en cours`} />
        <Stat label="À reverser" value={formatXof(toRelease)} hint={`${releasable.length} reversement(s) en attente`} />
        <Stat label="Reversements en cours" value={releasing.length} />
      </div>

      <Card className="mt-6">
        <CardHeader title="À reverser aux freelances" description="Commandes validées. Le reversement FedaPay est envoyé sur le compte Mobile Money du freelance." />
        {releasable.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">Aucun reversement en attente.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Commande</Th>
                <Th>Freelance</Th>
                <Th>Net à verser</Th>
                <Th>Validée le</Th>
                <Th className="text-right">Reversement</Th>
              </tr>
            </thead>
            <tbody>
              {releasable.map((e) => {
                const p = e.order.freelancer.freelancerProfile;
                const op = p?.payoutOperator ? PAYOUT_OPERATORS[p.payoutOperator] : null;
                const lastFailed = e.payouts[0]?.status === "FAILED" ? e.payouts[0] : null;
                return (
                  <tr key={e.id}>
                    <Td>
                      <Link href={`/admin/commandes/${e.order.id}`} className="font-medium decoration-brand-400 decoration-[3px] underline-offset-4 hover:underline">
                        {e.order.reference}
                      </Link>
                      <p className="max-w-56 truncate text-xs text-ink-500">{e.order.title}</p>
                    </Td>
                    <Td>
                      <p className="font-medium">{e.order.freelancer.name}</p>
                      <p className="text-xs text-ink-500">{op ? `${op.label} · ${p?.payoutPhone}` : <span className="text-red-600">Compte Mobile Money manquant</span>}</p>
                    </Td>
                    <Td className="font-semibold">{formatXof(e.freelancerNetXof)}</Td>
                    <Td className="text-xs">
                      {formatDate(e.releasableAt)}
                      {lastFailed && <p className="mt-1 text-red-600">Dernier essai échoué : {lastFailed.failureReason}</p>}
                    </Td>
                    <Td className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <form action={startPayoutAction}>
                          <input type="hidden" name="escrowId" value={e.id} />
                          <SubmitButton size="sm" pendingLabel="Envoi…" confirm={`Envoyer ${formatXof(e.freelancerNetXof)} à ${e.order.freelancer.name} via FedaPay ?`}>
                            Reverser via FedaPay
                          </SubmitButton>
                        </form>
                        <details className="text-left">
                          <summary className="cursor-pointer text-xs text-ink-500">Paiement manuel…</summary>
                          <form action={manualPayoutAction} className="mt-2 flex gap-1.5">
                            <input type="hidden" name="escrowId" value={e.id} />
                            <input name="note" placeholder="Réf. du virement" className="h-8 w-36 rounded-md border border-ink-200 px-2 text-xs" />
                            <SubmitButton size="sm" variant="outline" confirm="Confirmer que le freelance a été payé hors plateforme ?">
                              OK
                            </SubmitButton>
                          </form>
                        </details>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {releasing.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Reversements en cours de traitement" />
          <ul className="divide-y divide-ink-100">
            {releasing.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <div>
                  <p className="font-medium">
                    {e.order.reference} · {e.order.freelancer.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {formatXof(e.freelancerNetXof)} · FedaPay #{e.payouts[0]?.fedapayPayoutId ?? "—"}
                  </p>
                </div>
                {e.payouts[0] && (
                  <form action={refreshPayoutAction}>
                    <input type="hidden" name="payoutId" value={e.payouts[0].id} />
                    <SubmitButton size="sm" variant="outline">
                      Actualiser le statut
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Card>
          <CardHeader title="Derniers encaissements" />
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Commande</Th>
                <Th>Montant</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <Td className="text-xs">{formatDate(p.createdAt, true)}</Td>
                  <Td>
                    <Link href={`/admin/commandes/${p.order.id}`} className="font-medium decoration-brand-400 decoration-[3px] underline-offset-4 hover:underline">
                      {p.order.reference}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {p.order.client.name}
                      {p.mode ? ` · ${p.mode}` : ""}
                    </p>
                  </Td>
                  <Td>
                    {formatXof(p.amountXof)}
                    {p.order.displayCurrency !== "XOF" && <p className="text-xs text-ink-500">{formatMoney(Number(p.order.displayAmount), p.order.displayCurrency)}</p>}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} map={PAYMENT_STATUS} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card>
          <CardHeader title="Derniers reversements" />
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Freelance</Th>
                <Th>Montant</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <Td className="text-xs">{formatDate(p.createdAt, true)}</Td>
                  <Td>
                    <p className="font-medium">{p.freelancer.name}</p>
                    <p className="text-xs text-ink-500">
                      {p.escrow.order.reference} · {p.method === "MANUAL" ? `Manuel${p.note ? ` (${p.note})` : ""}` : `FedaPay${p.phone ? ` · ${p.phone}` : ""}`}
                    </p>
                  </Td>
                  <Td>{formatXof(p.amountXof)}</Td>
                  <Td>
                    <StatusBadge status={p.status} map={PAYOUT_STATUS} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
      <p className="mt-4 text-xs text-ink-500">Statuts du séquestre : {Object.values(ESCROW_STATUS).map((s) => s.label).join(" → ")}.</p>
    </>
  );
}
