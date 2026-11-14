import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { OrderList } from "@/components/orders/OrderList";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Commandes" };

const TABS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "actives", label: "En cours", statuses: ["AWAITING_PAYMENT", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED", "DISPUTED"] },
  { key: "terminees", label: "Terminées", statuses: ["COMPLETED"] },
  { key: "annulees", label: "Annulées", statuses: ["CANCELLED", "REFUNDED"] },
  { key: "toutes", label: "Toutes" },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const user = await requireUser(["FREELANCER", "CLIENT"]);
  const { onglet = "actives" } = await searchParams;
  const tab = TABS.find((t) => t.key === onglet) ?? TABS[0]!;
  const isFreelancer = user.role === "FREELANCER";

  const orders = await prisma.order.findMany({
    where: {
      ...(isFreelancer ? { freelancerId: user.id, status: { not: "AWAITING_PAYMENT" as const } } : { clientId: user.id }),
      ...(tab.statuses ? { AND: [{ status: { in: tab.statuses } }] } : {}),
    },
    include: { client: { select: { name: true } }, freelancer: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Commandes" description={isFreelancer ? "Les commandes de vos services et les missions qui vous sont confiées." : "Vos achats de services et vos missions en cours."} />
      <div className="scrollbar-none mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/tableau-de-bord/commandes?onglet=${t.key}`}
            className={cn("shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium", t.key === tab.key ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100")}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Card>
        {orders.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<ShoppingBag className="size-5" />} title="Aucune commande ici" />
          </div>
        ) : (
          <OrderList orders={orders} viewer={isFreelancer ? "FREELANCER" : "CLIENT"} />
        )}
      </Card>
    </>
  );
}
