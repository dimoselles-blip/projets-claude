import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, FileText, Lock, Package, Percent, Scale, ShoppingBag, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { formatXof } from "@/lib/currency";
import { runAutoCompletions } from "@/lib/escrow";
import { PageHeader, Stat } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { OrderList } from "@/components/orders/OrderList";

export const metadata: Metadata = { title: "Statistiques" };
export const dynamic = "force-dynamic";

const PAID = { paidAt: { not: null } } as const;

export default async function AdminDashboard() {
  await requireAdmin();
  // Filet de sécurité si le cron n'est pas encore configuré.
  await runAutoCompletions(20).catch(() => 0);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sixMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);

  const [
    freelancers,
    clients,
    newUsers,
    servicesSold,
    missionsPublished,
    volume,
    commissions,
    escrowByStatus,
    paidOrders,
    disputes,
    openDisputes,
    publishedServices,
    recentOrders,
    lastSixMonths,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "FREELANCER" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: { not: "ADMIN" }, createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { type: "SERVICE", ...PAID } }),
    prisma.mission.count({ where: { publishedAt: { not: null } } }),
    prisma.order.aggregate({ where: { ...PAID, status: { not: "REFUNDED" } }, _sum: { priceXof: true } }),
    prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { commissionXof: true } }),
    prisma.escrow.groupBy({ by: ["status"], _sum: { amountXof: true, freelancerNetXof: true }, _count: true }),
    prisma.order.count({ where: PAID }),
    prisma.dispute.count(),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.service.count({ where: { status: "PUBLISHED" } }),
    prisma.order.findMany({ where: PAID, include: { client: { select: { name: true } }, freelancer: { select: { name: true } } }, orderBy: { paidAt: "desc" }, take: 8 }),
    prisma.order.findMany({ where: { paidAt: { gte: sixMonthsAgo }, status: { not: "REFUNDED" } }, select: { paidAt: true, priceXof: true, type: true } }),
  ]);

  const escrow = (s: string) => escrowByStatus.find((e) => e.status === s);
  const held = escrow("HELD")?._sum.amountXof ?? 0;
  const toRelease = (escrow("RELEASABLE")?._sum.freelancerNetXof ?? 0) + (escrow("RELEASING")?._sum.freelancerNetXof ?? 0);
  const disputeRate = paidOrders ? (disputes / paidOrders) * 100 : 0;

  // Volume mensuel sur 6 mois
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d), service: 0, mission: 0 };
  });
  for (const o of lastSixMonths) {
    const d = o.paidAt!;
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m[o.type === "SERVICE" ? "service" : "mission"] += o.priceXof;
  }
  const max = Math.max(1, ...months.map((m) => m.service + m.mission));

  return (
    <>
      <PageHeader title="Vue d'ensemble" description="Activité de la marketplace Reelance." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Volume transactionnel" value={formatXof(volume._sum.priceXof ?? 0)} icon={<Banknote className="size-5" />} hint={`${paidOrders} commande(s) payée(s)`} />
        <Stat label="Commissions encaissées" value={formatXof(commissions._sum.commissionXof ?? 0)} icon={<Percent className="size-5" />} hint="Sur commandes terminées" />
        <Stat label="Services vendus" value={servicesSold} icon={<Package className="size-5" />} hint={`${publishedServices} service(s) en ligne`} />
        <Stat label="Missions publiées" value={missionsPublished} icon={<FileText className="size-5" />} />
        <Stat label="Fonds en séquestre" value={formatXof(held)} icon={<Lock className="size-5" />} />
        <Stat label="À reverser aux freelances" value={formatXof(toRelease)} icon={<Wallet className="size-5" />} hint={<Link href="/admin/paiements" className="text-brand-700">Traiter les reversements →</Link>} />
        <Stat label="Taux de litige" value={`${disputeRate.toFixed(1)} %`} icon={<Scale className="size-5" />} hint={`${openDisputes} litige(s) ouvert(s) · ${disputes} au total`} />
        <Stat label="Utilisateurs" value={freelancers + clients} icon={<Users className="size-5" />} hint={`${freelancers} freelances · ${clients} clients · +${newUsers} ce mois`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader title="Volume mensuel" description="Montants payés, 6 derniers mois (FCFA)" />
          <CardBody>
            <div className="flex h-56 items-end gap-3">
              {months.map((m) => {
                const total = m.service + m.mission;
                return (
                  <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[11px] font-medium text-ink-500">{total ? `${Math.round(total / 1000)}k` : ""}</span>
                    <div className="flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-t-lg bg-ink-100" style={{ height: `${Math.max(4, (total / max) * 180)}px` }}>
                      <div className="w-full bg-brand-300" style={{ height: `${total ? (m.mission / total) * 100 : 0}%` }} title={`Missions : ${formatXof(m.mission)}`} />
                      <div className="w-full bg-brand-600" style={{ height: `${total ? (m.service / total) * 100 : 0}%` }} title={`Services : ${formatXof(m.service)}`} />
                    </div>
                    <span className="text-xs text-ink-500 capitalize">{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-ink-600">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-brand-600" /> Services
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-brand-300" /> Missions
              </span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Dernières commandes payées" action={<Link href="/admin/commandes" className="text-sm font-semibold text-brand-700">Tout voir</Link>} />
          {recentOrders.length === 0 ? <p className="p-6 text-sm text-ink-500">Aucune commande payée pour l&apos;instant.</p> : <OrderList orders={recentOrders} viewer="ADMIN" hrefBase="/admin/commandes" />}
        </Card>
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-ink-500">
        <ShoppingBag className="size-4" /> Les montants sont en FCFA, devise d&apos;encaissement FedaPay.
      </p>
    </>
  );
}
