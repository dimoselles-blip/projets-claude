import "server-only";
import { prisma } from "@/lib/db";
import { config, isFedapayConfigured } from "@/lib/config";
import { addDays, splitName } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { PAYOUT_OPERATORS } from "@/lib/constants";
import * as fedapay from "@/lib/fedapay";
import {
  notifyCompleted,
  notifyDelivered,
  notifyOrderPaid,
  notifyPayoutSent,
  notifyRevisionRequested,
  safely,
} from "@/lib/notifications";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Moteur de séquestre (escrow), commun aux achats de services et aux missions.
 *
 *  AWAITING_PAYMENT ──paiement FedaPay──▶ IN_PROGRESS (séquestre HELD)
 *  IN_PROGRESS / REVISION_REQUESTED ──livraison──▶ DELIVERED (validation auto à J+N)
 *  DELIVERED ──retouche──▶ REVISION_REQUESTED
 *  DELIVERED ──validation client ou auto──▶ COMPLETED (séquestre RELEASABLE)
 *  * ──litige──▶ DISPUTED ──admin──▶ COMPLETED (pour le freelance) | REFUNDED (pour le client)
 *  RELEASABLE ──admin : reversement FedaPay──▶ RELEASING ──▶ RELEASED
 *
 * Chaque transition utilise une mise à jour conditionnelle (updateMany + statut attendu)
 * pour rester correcte si deux requêtes arrivent en même temps (webhook + retour client).
 */

type Tx = Prisma.TransactionClient;

export class EscrowError extends Error {}

async function logEvent(tx: Tx, orderId: string, type: string, message: string, actorId?: string | null) {
  await tx.orderEvent.create({ data: { orderId, type, message, actorId: actorId ?? null } });
}

async function transition(tx: Tx, orderId: string, from: OrderStatus[], data: Prisma.OrderUpdateManyMutationInput) {
  const res = await tx.order.updateMany({ where: { id: orderId, status: { in: from } }, data });
  if (res.count === 0) throw new EscrowError("Cette action n'est plus possible pour cette commande (statut modifié).");
}

// ───────────── Paiement ─────────────

export async function markPaymentApproved(
  paymentId: string,
  info: { mode?: string | null; reference?: string | null; payload?: Prisma.InputJsonValue },
) {
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: ["PENDING", "DECLINED", "CANCELED"] } },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        mode: info.mode ?? undefined,
        fedapayReference: info.reference ?? undefined,
        lastPayload: info.payload,
      },
    });
    if (claimed.count === 0) return null; // déjà traité (idempotence)

    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: true } });
    const order = payment.order;

    if (order.status !== "AWAITING_PAYMENT") {
      await logEvent(
        tx,
        order.id,
        "PAYMENT_LATE",
        `Paiement reçu alors que la commande n'attendait plus de paiement (${order.status}). Remboursement à effectuer depuis FedaPay.`,
      );
      return { orderId: order.id, late: true };
    }

    const now = new Date();
    await tx.order.update({
      where: { id: order.id },
      data: { status: "IN_PROGRESS", paidAt: now, dueAt: addDays(now, order.deliveryDays) },
    });
    await tx.escrow.create({
      data: {
        orderId: order.id,
        amountXof: payment.amountXof,
        commissionXof: order.commissionXof,
        freelancerNetXof: order.freelancerNetXof,
        displayCurrency: order.displayCurrency,
        displayAmount: order.displayAmount,
      },
    });
    if (order.type === "MISSION" && order.missionId) {
      await tx.mission.update({ where: { id: order.missionId }, data: { status: "IN_PROGRESS" } });
      await tx.application.updateMany({
        where: { missionId: order.missionId, status: "PENDING" },
        data: { status: "REJECTED" },
      });
    }
    await logEvent(tx, order.id, "PAYMENT_APPROVED", "Paiement reçu : les fonds sont bloqués en séquestre sur Reelance.");
    return { orderId: order.id, late: false };
  });

  if (result && !result.late) safely(notifyOrderPaid(result.orderId));
  return result;
}

export async function markPaymentFailed(paymentId: string, status: "DECLINED" | "CANCELED", payload?: Prisma.InputJsonValue) {
  await prisma.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status, lastPayload: payload } });
}

/** Interroge FedaPay et applique le statut réel d'une transaction (source de vérité). */
export async function syncPaymentWithFedapay(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.fedapayTransactionId) return null;
  const tx = await fedapay.retrieveTransaction(payment.fedapayTransactionId);
  const status = fedapay.mapTransactionStatus(tx.status);

  if (status === "APPROVED") {
    if (Number(tx.amount) !== payment.amountXof) {
      console.error(`[escrow] montant FedaPay (${tx.amount}) ≠ montant attendu (${payment.amountXof}) pour ${payment.id}`);
      return "PENDING" as const;
    }
    await markPaymentApproved(payment.id, { mode: tx.mode, reference: tx.reference, payload: tx as unknown as Prisma.InputJsonValue });
  } else if (status === "DECLINED" || status === "CANCELED") {
    await markPaymentFailed(payment.id, status, tx as unknown as Prisma.InputJsonValue);
  }
  return status;
}

// ───────────── Livraison & validation ─────────────

export async function deliverOrder(orderId: string, actorId: string, message: string, links: string[]) {
  const settings = await getSettings();
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await transition(tx, orderId, ["IN_PROGRESS", "REVISION_REQUESTED"], {
      status: "DELIVERED",
      deliveredAt: now,
      autoCompleteAt: addDays(now, settings.autoCompleteDays),
    });
    await tx.delivery.create({ data: { orderId, message, links } });
    await logEvent(tx, orderId, "DELIVERED", "Livraison envoyée par le freelance.", actorId);
  });
  safely(notifyDelivered(orderId, settings.autoCompleteDays));
}

export async function requestRevision(orderId: string, actorId: string, message: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.revisionsUsed >= order.revisionsAllowed) {
      throw new EscrowError("Toutes les retouches incluses ont déjà été utilisées.");
    }
    await transition(tx, orderId, ["DELIVERED"], {
      status: "REVISION_REQUESTED",
      revisionsUsed: { increment: 1 },
      autoCompleteAt: null,
    });
    await logEvent(tx, orderId, "REVISION_REQUESTED", `Retouche demandée : ${message}`, actorId);
  });
  safely(notifyRevisionRequested(orderId));
}

export async function completeOrder(orderId: string, mode: "CLIENT" | "AUTO" | "ADMIN", actorId?: string | null) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const from: OrderStatus[] = mode === "ADMIN" ? ["IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED", "DISPUTED"] : ["DELIVERED"];
    const res = await tx.order.updateMany({
      where: { id: orderId, status: { in: from }, ...(mode === "AUTO" ? { autoCompleteAt: { lte: now } } : {}) },
      data: { status: "COMPLETED", completedAt: now, completedAutomatically: mode === "AUTO", autoCompleteAt: null },
    });
    if (res.count === 0) throw new EscrowError("Cette commande ne peut pas être validée dans son état actuel.");

    const escrow = await tx.escrow.updateMany({
      where: { orderId, status: "HELD" },
      data: { status: "RELEASABLE", releasableAt: now },
    });
    if (escrow.count === 0) throw new EscrowError("Aucun fonds en séquestre pour cette commande.");

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.missionId) {
      await tx.mission.update({ where: { id: order.missionId }, data: { status: "COMPLETED" } });
    }
    const label = {
      CLIENT: "Livraison validée par le client.",
      AUTO: "Livraison validée automatiquement (délai de validation écoulé).",
      ADMIN: "Commande validée par l'équipe Reelance.",
    }[mode];
    await logEvent(tx, orderId, "COMPLETED", `${label} Le paiement du freelance est à reverser.`, actorId);
  });
  safely(notifyCompleted(orderId));
}

/** Valide automatiquement les livraisons sans réponse du client (appelé par le cron). */
export async function runAutoCompletions(limit = 100) {
  const due = await prisma.order.findMany({
    where: { status: "DELIVERED", autoCompleteAt: { lte: new Date() } },
    select: { id: true },
    take: limit,
  });
  let completed = 0;
  for (const { id } of due) {
    try {
      await completeOrder(id, "AUTO");
      completed++;
    } catch (err) {
      console.error(`[escrow] validation auto impossible pour ${id}`, err);
    }
  }
  return completed;
}

/** Valide une commande dont le délai est écoulé au moment où on l'affiche (complète le cron). */
export async function autoCompleteIfDue(orderId: string) {
  const due = await prisma.order.count({ where: { id: orderId, status: "DELIVERED", autoCompleteAt: { lte: new Date() } } });
  if (due) await completeOrder(orderId, "AUTO").catch((err) => console.error("[escrow] validation auto", err));
}

// ───────────── Annulation, litiges, remboursement ─────────────

export async function cancelUnpaidOrder(orderId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    await transition(tx, orderId, ["AWAITING_PAYMENT"], { status: "CANCELLED", cancelledAt: new Date() });
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.applicationId) {
      // Le client pourra retenir un autre freelance.
      await tx.application.update({ where: { id: order.applicationId }, data: { status: "PENDING" } });
    }
    await logEvent(tx, orderId, "CANCELLED", "Commande annulée avant paiement.", actorId);
  });
}

export async function openDispute(orderId: string, actorId: string, reason: string) {
  await prisma.$transaction(async (tx) => {
    await transition(tx, orderId, ["IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"], {
      status: "DISPUTED",
      autoCompleteAt: null,
    });
    await tx.dispute.create({ data: { orderId, openedById: actorId, reason } });
    await logEvent(tx, orderId, "DISPUTE_OPENED", `Litige ouvert : ${reason}`, actorId);
  });
}

export async function resolveDispute(orderId: string, adminId: string, outcome: "FREELANCER" | "CLIENT", note: string) {
  const dispute = await prisma.dispute.findUnique({ where: { orderId } });
  if (!dispute || dispute.status !== "OPEN") throw new EscrowError("Aucun litige ouvert pour cette commande.");

  if (outcome === "FREELANCER") {
    await completeOrder(orderId, "ADMIN", adminId);
  } else {
    await refundOrder(orderId, adminId, note);
  }
  await prisma.dispute.update({
    where: { orderId },
    data: {
      status: outcome === "FREELANCER" ? "RESOLVED_FOR_FREELANCER" : "RESOLVED_FOR_CLIENT",
      resolutionNote: note,
      resolvedById: adminId,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Remboursement du client. En V1, le remboursement FedaPay est effectué manuellement
 * par l'admin depuis le tableau de bord FedaPay ; Reelance enregistre la décision.
 */
export async function refundOrder(orderId: string, adminId: string, note: string) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await transition(tx, orderId, ["IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED", "DISPUTED"], {
      status: "REFUNDED",
      autoCompleteAt: null,
    });
    const escrow = await tx.escrow.updateMany({ where: { orderId, status: "HELD" }, data: { status: "REFUNDED", refundedAt: now } });
    if (escrow.count === 0) throw new EscrowError("Les fonds de cette commande ne sont plus en séquestre.");
    await tx.payment.updateMany({ where: { orderId, status: "APPROVED" }, data: { status: "REFUNDED" } });
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.missionId) await tx.mission.update({ where: { id: order.missionId }, data: { status: "CANCELLED" } });
    await logEvent(tx, orderId, "REFUNDED", `Client remboursé. ${note}`.trim(), adminId);
  });
}

// ───────────── Reversements aux freelances ─────────────

async function applyPayoutStatus(payoutId: string, fedapayStatus: string, errorMessage?: string | null) {
  const status = fedapay.mapPayoutStatus(fedapayStatus);
  const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId }, include: { escrow: true } });
  if (payout.status === status) return status;

  await prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payoutId },
      data: { status, sentAt: status === "SENT" ? new Date() : undefined, failureReason: status === "FAILED" ? errorMessage ?? "Échec FedaPay" : undefined },
    });
    if (status === "SENT") {
      await tx.escrow.updateMany({ where: { id: payout.escrowId, status: "RELEASING" }, data: { status: "RELEASED", releasedAt: new Date() } });
      await logEvent(tx, payout.escrow.orderId, "PAYOUT_SENT", "Paiement reversé au freelance via FedaPay.");
    } else if (status === "FAILED") {
      await tx.escrow.updateMany({ where: { id: payout.escrowId, status: "RELEASING" }, data: { status: "RELEASABLE" } });
      await logEvent(tx, payout.escrow.orderId, "PAYOUT_FAILED", `Échec du reversement : ${errorMessage ?? "erreur inconnue"}.`);
    }
  });
  if (status === "SENT") safely(notifyPayoutSent(payoutId));
  return status;
}

/** Lance le reversement FedaPay (Mobile Money) d'un séquestre « à reverser ». */
export async function startFedapayPayout(escrowId: string, adminId: string) {
  const locked = await prisma.escrow.updateMany({ where: { id: escrowId, status: "RELEASABLE" }, data: { status: "RELEASING" } });
  if (locked.count === 0) throw new EscrowError("Ce séquestre n'est pas (ou plus) à reverser.");

  const unlock = () => prisma.escrow.updateMany({ where: { id: escrowId, status: "RELEASING" }, data: { status: "RELEASABLE" } });

  const escrow = await prisma.escrow.findUniqueOrThrow({
    where: { id: escrowId },
    include: { order: { include: { freelancer: { include: { freelancerProfile: true } } } } },
  });
  const freelancer = escrow.order.freelancer;
  const profile = freelancer.freelancerProfile;
  const operator = profile?.payoutOperator ? PAYOUT_OPERATORS[profile.payoutOperator] : undefined;
  if (!profile?.payoutPhone || !operator) {
    await unlock();
    throw new EscrowError("Le freelance n'a pas encore renseigné son compte Mobile Money (profil → Paiements).");
  }

  const phone = fedapay.normalizePhone(profile.payoutPhone, operator.country);
  const payout = await prisma.payout.create({
    data: {
      escrowId,
      freelancerId: freelancer.id,
      amountXof: escrow.freelancerNetXof,
      method: "FEDAPAY",
      operator: profile.payoutOperator,
      phone,
      processedById: adminId,
    },
  });

  // Mode démo : pas d'appel réel à FedaPay.
  if (!isFedapayConfigured() && config.paymentSimulation) {
    return applyPayoutStatus(payout.id, "sent");
  }

  try {
    const { firstname, lastname } = splitName(freelancer.name);
    const created = await fedapay.createPayout({
      amountXof: escrow.freelancerNetXof,
      mode: operator.mode,
      merchantReference: payout.id,
      customer: { firstname, lastname, email: freelancer.email, phone_number: { number: phone, country: operator.country } },
    });
    await prisma.payout.update({
      where: { id: payout.id },
      data: { fedapayPayoutId: String(created.id), fedapayReference: created.reference },
    });
    const started = await fedapay.startPayout(created.id);
    return applyPayoutStatus(payout.id, started?.status ?? "processing", started?.last_error_message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur FedaPay";
    await prisma.payout.update({ where: { id: payout.id }, data: { status: "FAILED", failureReason: message } });
    await unlock();
    throw new EscrowError(`Le reversement a échoué : ${message}`);
  }
}

/** Met à jour un reversement en interrogeant FedaPay. */
export async function refreshPayout(payoutId: string) {
  const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
  if (!payout.fedapayPayoutId) return payout.status;
  const remote = await fedapay.retrievePayout(payout.fedapayPayoutId);
  return applyPayoutStatus(payout.id, remote.status, remote.last_error_message);
}

/** Appelé par le webhook FedaPay pour les événements payout.*. */
export async function syncPayoutFromWebhook(fedapayPayoutId: string, status: string, errorMessage?: string | null) {
  const payout = await prisma.payout.findUnique({ where: { fedapayPayoutId } });
  if (!payout) return null;
  return applyPayoutStatus(payout.id, status, errorMessage);
}

/** Reversement effectué hors plateforme (virement, Mobile Money manuel). */
export async function markPayoutManual(escrowId: string, adminId: string, note: string) {
  await prisma.$transaction(async (tx) => {
    const escrow = await tx.escrow.findUniqueOrThrow({ where: { id: escrowId }, include: { order: true } });
    const res = await tx.escrow.updateMany({ where: { id: escrowId, status: "RELEASABLE" }, data: { status: "RELEASED", releasedAt: new Date() } });
    if (res.count === 0) throw new EscrowError("Ce séquestre n'est pas à reverser.");
    await tx.payout.create({
      data: {
        escrowId,
        freelancerId: escrow.order.freelancerId,
        amountXof: escrow.freelancerNetXof,
        method: "MANUAL",
        status: "SENT",
        sentAt: new Date(),
        note,
        processedById: adminId,
      },
    });
    await logEvent(tx, escrow.orderId, "PAYOUT_SENT", `Paiement reversé manuellement au freelance. ${note}`.trim(), adminId);
  });
}
