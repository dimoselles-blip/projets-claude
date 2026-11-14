"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth/session";
import { deliverySchema, orderBriefSchema, toFieldErrors } from "@/lib/validation";
import { orderReference, splitList } from "@/lib/utils";
import { errorMessage, flash } from "@/lib/flash";
import { priceSnapshot, startPayment } from "@/lib/payments";
import { getDisplayCurrency } from "@/lib/display-currency";
import {
  cancelUnpaidOrder,
  completeOrder,
  deliverOrder,
  markPaymentApproved,
  markPaymentFailed,
  openDispute,
  requestRevision,
} from "@/lib/escrow";
import type { ActionState } from "@/lib/action-state";
import type { PackageTier } from "@/generated/prisma/enums";

const orderPath = (id: string) => `/tableau-de-bord/commandes/${id}`;

/** Achat direct d'un service : crée la commande puis redirige vers le paiement FedaPay. */
export async function createServiceOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Connectez-vous pour commander." };
  if (user.role !== "CLIENT") return { error: "Seuls les comptes client peuvent commander un service." };

  const parsed = orderBriefSchema.safeParse({ brief: formData.get("brief") });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const pkg = await prisma.servicePackage.findFirst({
    where: { serviceId: String(formData.get("serviceId")), tier: String(formData.get("tier")) as PackageTier },
    include: { service: true },
  });
  if (!pkg || pkg.service.status !== "PUBLISHED") return { error: "Ce service n'est plus disponible." };

  const snapshot = await priceSnapshot(pkg.priceXof, await getDisplayCurrency());
  const order = await prisma.order.create({
    data: {
      reference: orderReference(),
      type: "SERVICE",
      clientId: user.id,
      freelancerId: pkg.service.freelancerId,
      serviceId: pkg.serviceId,
      packageId: pkg.id,
      title: `${pkg.service.title} — offre ${pkg.name}`,
      brief: parsed.data.brief,
      deliveryDays: pkg.deliveryDays,
      revisionsAllowed: pkg.revisions,
      ...snapshot,
      events: { create: { type: "CREATED", message: "Commande créée. En attente du paiement.", actorId: user.id } },
    },
  });

  let url: string;
  try {
    url = await startPayment(order.id, user);
  } catch (err) {
    await flash("error", errorMessage(err));
    redirect(orderPath(order.id));
  }
  redirect(url);
}

export async function payOrderAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const orderId = String(formData.get("orderId"));
  let url: string;
  try {
    url = await startPayment(orderId, user);
  } catch (err) {
    await flash("error", errorMessage(err));
    redirect(orderPath(orderId));
  }
  redirect(url);
}

/** Mode démo uniquement (PAYMENT_SIMULATION=true, sans clés FedaPay). */
export async function simulatePaymentAction(formData: FormData) {
  if (!config.paymentSimulation) throw new Error("Simulation désactivée.");
  const user = await getCurrentUser();
  const payment = await prisma.payment.findUnique({ where: { id: String(formData.get("paymentId")) }, include: { order: true } });
  if (!user || !payment || payment.order.clientId !== user.id) redirect("/tableau-de-bord");

  if (formData.get("outcome") === "approved") {
    await markPaymentApproved(payment.id, { mode: "simulation", reference: `SIM-${payment.id.slice(-6)}` });
    redirect(`${orderPath(payment.orderId)}?paiement=APPROVED`);
  }
  await markPaymentFailed(payment.id, "DECLINED");
  redirect(`${orderPath(payment.orderId)}?paiement=DECLINED`);
}

async function loadOrderFor(orderId: string, role: "client" | "freelancer") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Vous devez être connecté.");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Commande introuvable.");
  const allowed = role === "client" ? order.clientId === user.id : order.freelancerId === user.id;
  if (!allowed) throw new Error("Action non autorisée.");
  return { user, order };
}

export async function deliverOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = String(formData.get("orderId"));
  const parsed = deliverySchema.safeParse({ message: formData.get("message"), links: splitList(formData.get("links"), 10) });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  try {
    const { user } = await loadOrderFor(orderId, "freelancer");
    await deliverOrder(orderId, user.id, parsed.data.message, parsed.data.links);
  } catch (err) {
    return { error: errorMessage(err) };
  }
  await flash("success", "Livraison envoyée. Le client a été prévenu.");
  revalidatePath(orderPath(orderId));
  return { ok: true, message: "Livraison envoyée. Le client a été prévenu." };
}

export async function acceptDeliveryAction(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  try {
    await loadOrderFor(orderId, "client");
    const user = await getCurrentUser();
    await completeOrder(orderId, "CLIENT", user!.id);
    await flash("success", "Merci ! La livraison est validée et le freelance va être payé.");
  } catch (err) {
    await flash("error", errorMessage(err));
  }
  revalidatePath(orderPath(orderId));
}

export async function requestRevisionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = String(formData.get("orderId"));
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 10) return { fieldErrors: { message: "Décrivez les retouches souhaitées (10 caractères minimum)." } };
  try {
    const { user } = await loadOrderFor(orderId, "client");
    await requestRevision(orderId, user.id, message);
  } catch (err) {
    return { error: errorMessage(err) };
  }
  await flash("success", "Demande de retouche envoyée au freelance.");
  revalidatePath(orderPath(orderId));
  return { ok: true, message: "Demande de retouche envoyée au freelance." };
}

export async function openDisputeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = String(formData.get("orderId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 20) return { fieldErrors: { reason: "Expliquez le problème (20 caractères minimum)." } };
  try {
    const user = await getCurrentUser();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!user || !order || (order.clientId !== user.id && order.freelancerId !== user.id)) throw new Error("Action non autorisée.");
    await openDispute(orderId, user.id, reason);
  } catch (err) {
    return { error: errorMessage(err) };
  }
  await flash("success", "Litige ouvert. L'équipe Reelance va examiner la commande ; les fonds restent bloqués.");
  revalidatePath(orderPath(orderId));
  return { ok: true, message: "Litige ouvert. L'équipe Reelance va examiner la commande ; les fonds restent bloqués." };
}

export async function cancelOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  try {
    const { user } = await loadOrderFor(orderId, "client");
    await cancelUnpaidOrder(orderId, user.id);
    await flash("success", "Commande annulée.");
  } catch (err) {
    await flash("error", errorMessage(err));
  }
  revalidatePath(orderPath(orderId));
}
