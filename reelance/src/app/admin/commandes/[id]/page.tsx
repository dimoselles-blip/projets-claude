import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { autoCompleteIfDue } from "@/lib/escrow";
import { OrderDetail, orderDetailInclude } from "@/components/orders/OrderDetail";

export const metadata: Metadata = { title: "Commande" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await autoCompleteIfDue(id);
  const order = await prisma.order.findUnique({ where: { id }, include: orderDetailInclude });
  if (!order) notFound();
  const settings = await getSettings();
  return (
    <>
      <Link href="/admin/commandes" className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-900">
        ← Toutes les commandes
      </Link>
      <OrderDetail order={order} viewer="ADMIN" autoCompleteDays={settings.autoCompleteDays} />
    </>
  );
}
