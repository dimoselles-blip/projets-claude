"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { applicationSchema, missionSchema, toFieldErrors } from "@/lib/validation";
import { orderReference, splitList } from "@/lib/utils";
import { flash } from "@/lib/flash";
import { priceSnapshot } from "@/lib/payments";
import { getDisplayCurrency } from "@/lib/display-currency";
import { notifyApplicationAccepted, notifyNewApplication, safely } from "@/lib/notifications";
import type { ActionState } from "@/lib/action-state";

// ───────────── Côté client ─────────────

export async function createMissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return { error: "Réservé aux comptes client." };

  const parsed = missionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    budgetMinXof: formData.get("budgetMinXof") ?? "",
    budgetMaxXof: formData.get("budgetMaxXof"),
    deadline: formData.get("deadline") ?? "",
    skills: splitList(formData.get("skills"), 10),
  });
  if (!parsed.success) return { error: "Veuillez corriger les champs indiqués.", fieldErrors: toFieldErrors(parsed.error) };
  const d = parsed.data;

  const category = await prisma.category.findFirst({ where: { id: d.categoryId, isActive: true } });
  if (!category) return { fieldErrors: { categoryId: "Catégorie invalide." } };

  const settings = await getSettings();
  const mission = await prisma.mission.create({
    data: {
      clientId: user.id,
      categoryId: d.categoryId,
      title: d.title,
      description: d.description,
      budgetMinXof: d.budgetMinXof === "" || d.budgetMinXof === undefined ? null : d.budgetMinXof,
      budgetMaxXof: d.budgetMaxXof,
      deadline: d.deadline === "" || d.deadline === undefined ? null : d.deadline,
      skills: d.skills,
      status: settings.requireMissionReview ? "PENDING_REVIEW" : "OPEN",
      publishedAt: settings.requireMissionReview ? null : new Date(),
    },
  });

  revalidatePath("/missions");
  await flash(
    "success",
    settings.requireMissionReview
      ? "Mission envoyée en validation. Les freelances pourront postuler dès sa publication."
      : "Mission publiée : les freelances peuvent postuler.",
  );
  redirect(`/tableau-de-bord/missions/${mission.id}`);
}

export async function cancelMissionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return;
  const id = String(formData.get("id"));
  const res = await prisma.mission.updateMany({
    where: { id, clientId: user.id, status: { in: ["PENDING_REVIEW", "OPEN"] }, orders: { none: { status: { notIn: ["CANCELLED"] } } } },
    data: { status: "CANCELLED" },
  });
  await flash(res.count ? "success" : "error", res.count ? "Mission annulée." : "Cette mission ne peut plus être annulée.");
  revalidatePath(`/tableau-de-bord/missions/${id}`);
  revalidatePath("/missions");
}

/** Le client retient une candidature : crée la commande (en attente de paiement). */
export async function acceptApplicationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return;
  const applicationId = String(formData.get("applicationId"));

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { mission: { include: { orders: true } }, freelancer: true },
  });
  const mission = application?.mission;
  if (!application || !mission || mission.clientId !== user.id) {
    await flash("error", "Candidature introuvable.");
    return;
  }
  if (mission.status !== "OPEN" || application.status !== "PENDING") {
    await flash("error", "Cette candidature ne peut plus être retenue.");
    return;
  }
  const pendingOrder = mission.orders.find((o) => o.status !== "CANCELLED");
  if (pendingOrder) {
    await flash("error", "Une commande est déjà en cours pour cette mission. Annulez-la avant de retenir un autre freelance.");
    redirect(`/tableau-de-bord/commandes/${pendingOrder.id}`);
  }

  const [settings, currency] = await Promise.all([getSettings(), getDisplayCurrency()]);
  const snapshot = await priceSnapshot(application.priceXof, currency);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference: orderReference(),
        type: "MISSION",
        clientId: user.id,
        freelancerId: application.freelancerId,
        missionId: mission.id,
        applicationId: application.id,
        title: mission.title,
        brief: mission.description,
        deliveryDays: application.deliveryDays,
        revisionsAllowed: settings.missionRevisions,
        ...snapshot,
      },
    });
    await tx.application.update({ where: { id: application.id }, data: { status: "ACCEPTED" } });
    await tx.orderEvent.create({
      data: { orderId: created.id, type: "CREATED", message: `Candidature de ${application.freelancer.name} retenue. En attente du paiement.`, actorId: user.id },
    });
    return created;
  });

  safely(notifyApplicationAccepted(order.id));
  await flash("success", "Freelance retenu ! Réglez la commande pour démarrer la mission : les fonds restent bloqués jusqu'à votre validation.");
  redirect(`/tableau-de-bord/commandes/${order.id}`);
}

export async function rejectApplicationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return;
  const applicationId = String(formData.get("applicationId"));
  const res = await prisma.application.updateMany({
    where: { id: applicationId, status: "PENDING", mission: { clientId: user.id } },
    data: { status: "REJECTED" },
  });
  if (res.count) await flash("success", "Candidature écartée.");
  revalidatePath("/tableau-de-bord/missions");
}

// ───────────── Côté freelance ─────────────

export async function applyToMissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") return { error: "Connectez-vous avec un compte freelance pour postuler." };
  const missionId = String(formData.get("missionId"));

  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Veuillez corriger les champs indiqués.", fieldErrors: toFieldErrors(parsed.error) };

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.status !== "OPEN") return { error: "Cette mission n'accepte plus de candidatures." };

  const existing = await prisma.application.findUnique({ where: { missionId_freelancerId: { missionId, freelancerId: user.id } } });
  if (existing && existing.status !== "WITHDRAWN") return { error: "Vous avez déjà postulé à cette mission." };

  if (existing) {
    await prisma.application.update({ where: { id: existing.id }, data: { ...parsed.data, status: "PENDING" } });
  } else {
    await prisma.application.create({ data: { missionId, freelancerId: user.id, ...parsed.data } });
  }
  safely(notifyNewApplication(missionId, user.name));
  await flash("success", "Candidature envoyée ! Le client sera prévenu par e-mail.");
  revalidatePath(`/missions/${missionId}`);
  revalidatePath("/tableau-de-bord/candidatures");
  return { ok: true, message: "Candidature envoyée ! Le client sera prévenu par e-mail." };
}

export async function withdrawApplicationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") return;
  const res = await prisma.application.updateMany({
    where: { id: String(formData.get("applicationId")), freelancerId: user.id, status: "PENDING" },
    data: { status: "WITHDRAWN" },
  });
  if (res.count) await flash("success", "Candidature retirée.");
  revalidatePath("/tableau-de-bord/candidatures");
}
