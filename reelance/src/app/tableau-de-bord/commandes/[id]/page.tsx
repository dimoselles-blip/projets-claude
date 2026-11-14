import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { autoCompleteIfDue } from "@/lib/escrow";
import { OrderDetail, orderDetailInclude } from "@/components/orders/OrderDetail";

export const metadata: Metadata = { title: "Commande" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paiement?: string }> }) {
  const user = await requireUser(["FREELANCER", "CLIENT"]);
  const { id } = await params;
  const { paiement } = await searchParams;

  await autoCompleteIfDue(id);
  const order = await prisma.order.findUnique({ where: { id }, include: orderDetailInclude });
  if (!order) notFound();
  const viewer = order.clientId === user.id ? "CLIENT" : order.freelancerId === user.id ? "FREELANCER" : null;
  if (!viewer) notFound();
  // Le freelance ne voit pas une commande non payée de service (elle n'est pas encore « réelle »).
  if (viewer === "FREELANCER" && order.status === "AWAITING_PAYMENT" && order.type === "SERVICE") notFound();

  const settings = await getSettings();
  return <OrderDetail order={order} viewer={viewer} paymentReturn={paiement} autoCompleteDays={settings.autoCompleteDays} />;
}
