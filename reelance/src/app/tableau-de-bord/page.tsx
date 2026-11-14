import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Clock, Coins, FileText, Inbox, Lock, PackageCheck, PlusCircle, Search, ShoppingBag, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatXof } from "@/lib/currency";
import { MISSION_STATUS } from "@/lib/constants";
import { PageHeader, Stat, EmptyState } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { OrderList } from "@/components/orders/OrderList";
import { Price } from "@/components/Price";
import type { CurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tableau de bord" };

const orderInclude = { client: { select: { name: true } }, freelancer: { select: { name: true } } } as const;

export default async function DashboardPage() {
  const user = await requireUser(["FREELANCER", "CLIENT"]);
  return user.role === "FREELANCER" ? <FreelancerOverview user={user} /> : <ClientOverview user={user} />;
}

async function FreelancerOverview({ user }: { user: CurrentUser }) {
  const profile = user.freelancerProfile!;
  const [orders, active, toValidate, escrows, services, portfolioCount, applications] = await Promise.all([
    prisma.order.findMany({ where: { freelancerId: user.id, status: { not: "AWAITING_PAYMENT" } }, include: orderInclude, orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.order.count({ where: { freelancerId: user.id, status: { in: ["IN_PROGRESS", "REVISION_REQUESTED"] } } }),
    prisma.order.count({ where: { freelancerId: user.id, status: "DELIVERED" } }),
    prisma.escrow.groupBy({ by: ["status"], where: { order: { freelancerId: user.id } }, _sum: { freelancerNetXof: true } }),
    prisma.service.count({ where: { freelancerId: user.id } }),
    prisma.portfolioItem.count({ where: { profileId: profile.id } }),
    prisma.application.count({ where: { freelancerId: user.id, status: "PENDING" } }),
  ]);
  const sum = (...s: string[]) => escrows.filter((e) => s.includes(e.status)).reduce((t, e) => t + (e._sum.freelancerNetXof ?? 0), 0);

  const todo = [
    !profile.headline && { href: "/tableau-de-bord/profil", label: "Complétez votre profil (titre, présentation, compétences)" },
    portfolioCount === 0 && { href: "/tableau-de-bord/profil#portfolio", label: "Ajoutez au moins une réalisation à votre portfolio" },
    !profile.payoutPhone && { href: "/tableau-de-bord/profil#paiements", label: "Renseignez votre compte Mobile Money pour être payé" },
    services === 0 && { href: "/tableau-de-bord/services/nouveau", label: "Publiez votre premier service" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      <PageHeader
        title={`Bonjour ${user.name.split(" ")[0]} 👋`}
        description="Suivez vos commandes, vos candidatures et vos paiements."
        actions={
          <>
            <LinkButton href="/missions" variant="outline">
              <Search className="size-4" /> Missions ouvertes
            </LinkButton>
            <LinkButton href="/tableau-de-bord/services/nouveau">
              <PlusCircle className="size-4" /> Nouveau service
            </LinkButton>
          </>
        }
      />

      {todo.length > 0 && (
        <Card className="mb-6 border-brand-300 bg-brand-50">
          <div className="p-5 sm:p-6">
            <p className="flex items-center gap-2 font-semibold text-ink-950">
              <CircleAlert className="size-5 text-ink-950" /> Pour recevoir vos premières commandes
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {todo.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="link-brand font-medium">
                    → {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="En cours" value={active} icon={<Clock className="size-5" />} hint="À livrer ou à retoucher" />
        <Stat label="À valider par le client" value={toValidate} icon={<PackageCheck className="size-5" />} />
        <Stat label="En séquestre" value={formatXof(sum("HELD"))} icon={<Lock className="size-5" />} hint="Payé par vos clients, bloqué" />
        <Stat label="À recevoir" value={formatXof(sum("RELEASABLE", "RELEASING"))} icon={<Wallet className="size-5" />} hint={`Déjà reçu : ${formatXof(sum("RELEASED"))}`} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Commandes récentes"
          action={
            <Link href="/tableau-de-bord/commandes" className="text-sm link-brand">
              Tout voir
            </Link>
          }
        />
        {orders.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Inbox className="size-5" />} title="Aucune commande pour l'instant" description={`Vous avez ${applications} candidature(s) en attente. Publiez des services et postulez aux missions pour décrocher vos premiers projets.`} />
          </div>
        ) : (
          <OrderList orders={orders} viewer="FREELANCER" />
        )}
      </Card>
    </>
  );
}

async function ClientOverview({ user }: { user: CurrentUser }) {
  const [actionNeeded, recent, inProgress, spent, missions] = await Promise.all([
    prisma.order.findMany({ where: { clientId: user.id, status: { in: ["AWAITING_PAYMENT", "DELIVERED"] } }, include: orderInclude, orderBy: { updatedAt: "desc" } }),
    prisma.order.findMany({ where: { clientId: user.id }, include: orderInclude, orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.order.count({ where: { clientId: user.id, status: { in: ["IN_PROGRESS", "REVISION_REQUESTED", "DELIVERED"] } } }),
    prisma.order.aggregate({ where: { clientId: user.id, paidAt: { not: null }, status: { not: "REFUNDED" } }, _sum: { priceXof: true } }),
    prisma.mission.findMany({
      where: { clientId: user.id, status: { in: ["PENDING_REVIEW", "OPEN", "IN_PROGRESS"] } },
      include: { _count: { select: { applications: { where: { status: "PENDING" } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <>
      <PageHeader
        title={`Bonjour ${user.name.split(" ")[0]} 👋`}
        description={user.clientProfile?.companyName ? `Espace ${user.clientProfile.companyName}` : "Suivez vos commandes et vos missions."}
        actions={
          <>
            <LinkButton href="/services" variant="outline">
              <Search className="size-4" /> Trouver un service
            </LinkButton>
            <LinkButton href="/tableau-de-bord/missions/nouvelle">
              <PlusCircle className="size-4" /> Publier une mission
            </LinkButton>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Commandes en cours" value={inProgress} icon={<ShoppingBag className="size-5" />} />
        <Stat label="Livraisons à valider" value={actionNeeded.filter((o) => o.status === "DELIVERED").length} icon={<PackageCheck className="size-5" />} />
        <Stat label="Missions actives" value={missions.length} icon={<FileText className="size-5" />} />
        <Stat label="Total investi" value={<Price xof={spent._sum.priceXof ?? 0} />} icon={<Coins className="size-5" />} />
      </div>

      {actionNeeded.length > 0 && (
        <Card className="mt-6 border-amber-200">
          <CardHeader title="À traiter" description="Paiements en attente et livraisons à valider." />
          <OrderList orders={actionNeeded} viewer="CLIENT" />
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Commandes récentes" action={<Link href="/tableau-de-bord/commandes" className="text-sm link-brand">Tout voir</Link>} />
          {recent.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<ShoppingBag className="size-5" />} title="Aucune commande" description="Achetez un service clé en main ou publiez une mission pour recevoir des devis." action={<LinkButton href="/services">Parcourir les services</LinkButton>} />
            </div>
          ) : (
            <OrderList orders={recent} viewer="CLIENT" />
          )}
        </Card>
        <Card>
          <CardHeader title="Mes missions" action={<Link href="/tableau-de-bord/missions" className="text-sm link-brand">Tout voir</Link>} />
          {missions.length === 0 ? (
            <p className="p-6 text-sm text-ink-500">Aucune mission active.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {missions.map((m) => (
                <li key={m.id}>
                  <Link href={`/tableau-de-bord/missions/${m.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-ink-50/70 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.title}</p>
                      <p className="text-xs text-ink-500">{m._count.applications} candidature(s) à examiner</p>
                    </div>
                    <StatusBadge status={m.status} map={MISSION_STATUS} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
