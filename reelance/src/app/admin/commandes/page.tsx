import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { ORDER_STATUS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { OrderList } from "@/components/orders/OrderList";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Commandes" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; type?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(sp.statut && sp.statut in ORDER_STATUS ? { status: sp.statut as OrderStatus } : {}),
    ...(sp.type === "SERVICE" || sp.type === "MISSION" ? { type: sp.type } : {}),
    ...(sp.q ? { OR: [{ reference: { contains: sp.q, mode: "insensitive" } }, { title: { contains: sp.q, mode: "insensitive" } }] } : {}),
  };
  const orders = await prisma.order.findMany({
    where,
    include: { client: { select: { name: true } }, freelancer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Commandes" description="Toutes les commandes : achats de services et missions." />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Référence ou titre…" className="h-10 min-w-56 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm" />
        <select name="statut" defaultValue={sp.statut ?? ""} className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm">
          <option value="">Tous les statuts</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={sp.type ?? ""} className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm">
          <option value="">Services et missions</option>
          <option value="SERVICE">Services</option>
          <option value="MISSION">Missions</option>
        </select>
        <button className="h-10 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white">Filtrer</button>
      </form>
      <Card>{orders.length === 0 ? <p className="p-6 text-sm text-ink-500">Aucune commande.</p> : <OrderList orders={orders} viewer="ADMIN" hrefBase="/admin/commandes" />}</Card>
    </>
  );
}
