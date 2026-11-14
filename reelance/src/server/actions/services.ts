"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { packageSchema, serviceSchema, toFieldErrors } from "@/lib/validation";
import { PACKAGE_TIERS } from "@/lib/constants";
import { randomCode, slugify, splitList } from "@/lib/utils";
import { flash } from "@/lib/flash";
import type { ActionState } from "@/lib/action-state";
import type { PackageTier } from "@/generated/prisma/enums";

/**
 * Création / modification d'un service (gig). Un service a de 1 à 3 offres (Essentiel obligatoire,
 * Standard et Premium facultatives). Le prix est saisi une seule fois, en FCFA.
 */
export async function saveServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") return { error: "Réservé aux comptes freelance." };

  const serviceId = String(formData.get("serviceId") ?? "") || null;
  const intent = formData.get("intent") === "draft" ? "draft" : "submit";

  const parsed = serviceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    coverUrl: formData.get("coverUrl") ?? "",
    videoUrl: formData.get("videoUrl") ?? "",
    tags: splitList(formData.get("tags"), 8),
  });

  const fieldErrors: Record<string, string> = parsed.success ? {} : toFieldErrors(parsed.error);
  const packages: { tier: PackageTier; data: ReturnType<typeof packageSchema.parse> }[] = [];

  for (const { tier } of PACKAGE_TIERS) {
    const enabled = tier === "BASIC" || formData.get(`pkg_${tier}_enabled`) === "on";
    if (!enabled) continue;
    const p = packageSchema.safeParse({
      enabled,
      name: formData.get(`pkg_${tier}_name`),
      description: formData.get(`pkg_${tier}_description`) ?? "",
      priceXof: formData.get(`pkg_${tier}_price`),
      deliveryDays: formData.get(`pkg_${tier}_days`),
      revisions: formData.get(`pkg_${tier}_revisions`) || 0,
      features: splitList(formData.get(`pkg_${tier}_features`), 10),
    });
    if (p.success) packages.push({ tier, data: p.data });
    else for (const [k, v] of Object.entries(toFieldErrors(p.error))) fieldErrors[`pkg_${tier}_${k}`] = v;
  }

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: "Veuillez corriger les champs indiqués.", fieldErrors };
  }

  const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, isActive: true } });
  if (!category) return { fieldErrors: { categoryId: "Catégorie invalide." } };

  const existing = serviceId ? await prisma.service.findFirst({ where: { id: serviceId, freelancerId: user.id } }) : null;
  if (serviceId && !existing) return { error: "Service introuvable." };

  const settings = await getSettings();
  const status =
    intent === "draft" ? (existing?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT") : settings.requireServiceReview ? "PENDING_REVIEW" : "PUBLISHED";

  const data = {
    ...parsed.data,
    status,
    rejectionReason: null,
    publishedAt: status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
  } as const;

  const saved = await prisma.$transaction(async (tx) => {
    const service = existing
      ? await tx.service.update({ where: { id: existing.id }, data })
      : await tx.service.create({
          data: { ...data, freelancerId: user.id, slug: `${slugify(parsed.data.title)}-${randomCode(5).toLowerCase()}` },
        });

    const enabledTiers = packages.map((p) => p.tier);
    await tx.servicePackage.deleteMany({ where: { serviceId: service.id, tier: { notIn: enabledTiers } } });
    for (const { tier, data: pkg } of packages) {
      const { enabled: _e, ...values } = pkg;
      await tx.servicePackage.upsert({
        where: { serviceId_tier: { serviceId: service.id, tier } },
        create: { serviceId: service.id, tier, ...values },
        update: values,
      });
    }
    return service;
  });

  revalidatePath("/tableau-de-bord/services");
  revalidatePath(`/services/${saved.slug}`);
  revalidatePath("/services");
  await flash(
    "success",
    status === "PENDING_REVIEW"
      ? "Service envoyé en validation. Il sera visible dès qu'un administrateur l'aura approuvé."
      : status === "PUBLISHED"
        ? "Service publié."
        : "Brouillon enregistré.",
  );
  redirect("/tableau-de-bord/services");
}

export async function setServiceStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") return;
  const id = String(formData.get("id"));
  const op = String(formData.get("op"));
  const service = await prisma.service.findFirst({ where: { id, freelancerId: user.id } });
  if (!service) return;

  if (op === "pause" && service.status === "PUBLISHED") {
    await prisma.service.update({ where: { id }, data: { status: "PAUSED" } });
    await flash("success", "Service mis en pause : il n'apparaît plus dans le catalogue.");
  } else if (op === "resume" && service.status === "PAUSED") {
    await prisma.service.update({ where: { id }, data: { status: "PUBLISHED" } });
    await flash("success", "Service remis en ligne.");
  } else if (op === "delete") {
    const orders = await prisma.order.count({ where: { serviceId: id } });
    if (orders > 0) {
      await prisma.service.update({ where: { id }, data: { status: "PAUSED" } });
      await flash("error", "Ce service a déjà des commandes : il a été mis en pause au lieu d'être supprimé.");
    } else {
      await prisma.service.delete({ where: { id } });
      await flash("success", "Service supprimé.");
    }
  }
  revalidatePath("/tableau-de-bord/services");
  revalidatePath("/services");
}
