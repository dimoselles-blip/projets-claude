"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { errorMessage, flash } from "@/lib/flash";
import { saveSettings } from "@/lib/settings";
import { refreshExchangeRates } from "@/lib/rates";
import { slugify } from "@/lib/utils";
import { toFieldErrors } from "@/lib/validation";
import {
  completeOrder,
  markPayoutManual,
  refreshPayout,
  refundOrder,
  resolveDispute,
  startFedapayPayout,
} from "@/lib/escrow";
import type { ActionState } from "@/lib/action-state";

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé à l'administration.");
  return user;
}

/** Exécute une action admin « bouton » et affiche le résultat en message flash. */
async function run(fn: (adminId: string) => Promise<string>, paths: string[]) {
  try {
    const user = await admin();
    const message = await fn(user.id);
    await flash("success", message);
  } catch (err) {
    await flash("error", errorMessage(err));
  }
  for (const p of paths) revalidatePath(p);
}

// ───────────── Modération ─────────────

export async function moderateServiceAction(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  await run(async (adminId) => {
    const service = await prisma.service.findUniqueOrThrow({ where: { id } });
    if (decision === "approve") {
      await prisma.service.update({ where: { id }, data: { status: "PUBLISHED", rejectionReason: null, publishedAt: service.publishedAt ?? new Date() } });
    } else if (decision === "reject") {
      if (!reason) throw new Error("Indiquez le motif du refus : il sera affiché au freelance.");
      await prisma.service.update({ where: { id }, data: { status: "REJECTED", rejectionReason: reason } });
    } else if (decision === "pause") {
      await prisma.service.update({ where: { id }, data: { status: "PAUSED", rejectionReason: reason } });
    } else throw new Error("Décision inconnue.");
    await audit(adminId, `service.${decision}`, "Service", id, { reason });
    revalidatePath(`/services/${service.slug}`);
    return decision === "approve" ? "Service publié." : decision === "reject" ? "Service refusé." : "Service suspendu.";
  }, ["/admin/services", "/services", "/"]);
}

export async function moderateMissionAction(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  await run(async (adminId) => {
    if (decision === "approve") {
      await prisma.mission.update({ where: { id }, data: { status: "OPEN", rejectionReason: null, publishedAt: new Date() } });
    } else if (decision === "reject") {
      if (!reason) throw new Error("Indiquez le motif du refus.");
      await prisma.mission.update({ where: { id }, data: { status: "REJECTED", rejectionReason: reason } });
    } else throw new Error("Décision inconnue.");
    await audit(adminId, `mission.${decision}`, "Mission", id, { reason });
    return decision === "approve" ? "Mission publiée." : "Mission refusée.";
  }, ["/admin/missions", "/missions"]);
}

export async function setUserStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const status = formData.get("status") === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  await run(async (adminId) => {
    if (id === adminId) throw new Error("Vous ne pouvez pas suspendre votre propre compte.");
    const target = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (target.role === "ADMIN") throw new Error("Un compte administrateur ne peut pas être suspendu ici.");
    await prisma.user.update({ where: { id }, data: { status } });
    if (status === "SUSPENDED") {
      await prisma.session.deleteMany({ where: { userId: id } });
      if (target.role === "FREELANCER") {
        await prisma.service.updateMany({ where: { freelancerId: id, status: "PUBLISHED" }, data: { status: "PAUSED" } });
      }
    }
    await audit(adminId, `user.${status.toLowerCase()}`, "User", id);
    return status === "SUSPENDED" ? `${target.name} est suspendu(e).` : `${target.name} est réactivé(e).`;
  }, ["/admin/utilisateurs", "/services"]);
}

export async function toggleVerifiedAction(formData: FormData) {
  const profileId = String(formData.get("profileId"));
  await run(async (adminId) => {
    const profile = await prisma.freelancerProfile.findUniqueOrThrow({ where: { id: profileId } });
    await prisma.freelancerProfile.update({ where: { id: profileId }, data: { isVerified: !profile.isVerified } });
    await audit(adminId, profile.isVerified ? "freelancer.unverify" : "freelancer.verify", "FreelancerProfile", profileId);
    return profile.isVerified ? "Badge « vérifié » retiré." : "Profil marqué comme vérifié.";
  }, ["/admin/utilisateurs", "/freelances"]);
}

// ───────────── Paiements & séquestre ─────────────

export async function startPayoutAction(formData: FormData) {
  const escrowId = String(formData.get("escrowId"));
  await run(async (adminId) => {
    const status = await startFedapayPayout(escrowId, adminId);
    await audit(adminId, "payout.fedapay", "Escrow", escrowId, { status });
    return status === "SENT" ? "Reversement envoyé au freelance." : "Reversement transmis à FedaPay : statut en cours de traitement.";
  }, ["/admin/paiements", "/admin"]);
}

export async function manualPayoutAction(formData: FormData) {
  const escrowId = String(formData.get("escrowId"));
  const note = String(formData.get("note") ?? "").trim();
  await run(async (adminId) => {
    if (note.length < 3) throw new Error("Indiquez une référence du virement manuel.");
    await markPayoutManual(escrowId, adminId, note);
    await audit(adminId, "payout.manual", "Escrow", escrowId, { note });
    return "Reversement manuel enregistré.";
  }, ["/admin/paiements", "/admin"]);
}

export async function refreshPayoutAction(formData: FormData) {
  const payoutId = String(formData.get("payoutId"));
  await run(async () => {
    const status = await refreshPayout(payoutId);
    return `Statut FedaPay : ${status}.`;
  }, ["/admin/paiements"]);
}

export async function adminCompleteOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  await run(async (adminId) => {
    await completeOrder(orderId, "ADMIN", adminId);
    await audit(adminId, "order.force_complete", "Order", orderId);
    return "Commande validée : le paiement du freelance est à reverser.";
  }, [`/admin/commandes/${orderId}`, "/admin/paiements"]);
}

export async function adminRefundOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const note = String(formData.get("note") ?? "").trim();
  await run(async (adminId) => {
    await refundOrder(orderId, adminId, note);
    await audit(adminId, "order.refund", "Order", orderId, { note });
    return "Commande marquée comme remboursée. Effectuez le remboursement depuis votre tableau de bord FedaPay.";
  }, [`/admin/commandes/${orderId}`, "/admin/paiements"]);
}

export async function resolveDisputeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = String(formData.get("orderId"));
  const outcome = formData.get("outcome") === "CLIENT" ? "CLIENT" : "FREELANCER";
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 10) return { fieldErrors: { note: "Motivez la décision (10 caractères minimum) : elle est visible par les deux parties." } };
  try {
    const user = await admin();
    await resolveDispute(orderId, user.id, outcome, note);
    await audit(user.id, `dispute.resolve.${outcome.toLowerCase()}`, "Order", orderId, { note });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  await flash("success", outcome === "FREELANCER" ? "Litige tranché en faveur du freelance." : "Litige tranché en faveur du client.");
  revalidatePath("/admin/litiges");
  revalidatePath(`/admin/commandes/${orderId}`);
  return { ok: true, message: outcome === "FREELANCER" ? "Litige tranché en faveur du freelance." : "Litige tranché en faveur du client." };
}

// ───────────── Catégories ─────────────

const categorySchema = z.object({
  name: z.string().trim().min(2, "Nom : 2 caractères minimum.").max(60),
  slug: z.string().trim().max(70).optional(),
  description: z.string().trim().max(300).optional(),
  icon: z.string().trim().max(30).optional(),
  parentId: z.string().optional(),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await admin();
  } catch (err) {
    return { error: errorMessage(err) };
  }
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const id = String(formData.get("id") ?? "") || null;
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  const parentId = d.parentId || null;
  if (parentId && parentId === id) return { fieldErrors: { parentId: "Une catégorie ne peut pas être son propre parent." } };
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.parentId) return { fieldErrors: { parentId: "Le parent doit être une catégorie principale." } };
  }
  const clash = await prisma.category.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { fieldErrors: { slug: "Ce slug est déjà utilisé." } };

  const data = {
    name: d.name,
    slug,
    description: d.description || null,
    icon: d.icon || null,
    parentId,
    position: d.position,
    isActive: formData.get("isActive") === "on",
  };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Catégorie mise à jour." : "Catégorie créée." };
}

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get("id"));
  await run(async (adminId) => {
    const usage = await prisma.category.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { children: true, services: true, missions: true } } },
    });
    if (usage._count.children || usage._count.services || usage._count.missions) {
      throw new Error("Cette catégorie est utilisée (sous-catégories, services ou missions). Désactivez-la plutôt.");
    }
    await prisma.category.delete({ where: { id } });
    await audit(adminId, "category.delete", "Category", id, { name: usage.name });
    return "Catégorie supprimée.";
  }, ["/admin/categories"]);
}

// ───────────── Paramètres ─────────────

const settingsSchema = z.object({
  commissionPercent: z.coerce.number().min(0, "0 % minimum.").max(50, "50 % maximum."),
  autoCompleteDays: z.coerce.number().int().min(1, "1 jour minimum.").max(30, "30 jours maximum."),
  missionRevisions: z.coerce.number().int().min(0).max(10),
});

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await admin();
  } catch (err) {
    return { error: errorMessage(err) };
  }
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const values = {
    commissionRateBps: Math.round(parsed.data.commissionPercent * 100),
    autoCompleteDays: parsed.data.autoCompleteDays,
    missionRevisions: parsed.data.missionRevisions,
    requireServiceReview: formData.get("requireServiceReview") === "on",
    requireMissionReview: formData.get("requireMissionReview") === "on",
  };
  await saveSettings(values);
  await audit(user.id, "settings.update", "Setting", "platform", values);
  revalidatePath("/admin/parametres");
  return { ok: true, message: "Paramètres enregistrés. Ils s'appliquent aux nouvelles commandes." };
}

export async function refreshRatesAction() {
  await run(async () => {
    const updated = await refreshExchangeRates();
    return `Taux de change mis à jour (${updated.join(", ")}).`;
  }, ["/admin/parametres", "/", "/services"]);
}
