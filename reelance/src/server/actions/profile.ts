"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { clientProfileSchema, freelancerProfileSchema, payoutSchema, portfolioSchema, toFieldErrors } from "@/lib/validation";
import { PAYOUT_OPERATORS } from "@/lib/constants";
import { splitList } from "@/lib/utils";
import { flash } from "@/lib/flash";
import type { ActionState } from "@/lib/action-state";

const invalid = (error: import("zod").ZodError): ActionState => ({
  error: "Veuillez corriger les champs indiqués.",
  fieldErrors: toFieldErrors(error),
});

async function freelancer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER" || !user.freelancerProfile) throw new Error("Réservé aux comptes freelance.");
  return { user, profile: user.freelancerProfile };
}

export async function updateFreelancerProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, profile } = await freelancer();
  const parsed = freelancerProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: d.name,
      phone: d.phone || null,
      country: d.country,
      freelancerProfile: {
        update: {
          headline: d.headline,
          bio: d.bio,
          avatarUrl: d.avatarUrl,
          city: d.city || null,
          country: d.country,
          dayRateXof: d.dayRateXof === "" || d.dayRateXof === undefined ? null : d.dayRateXof,
          yearsExperience: d.yearsExperience === "" || d.yearsExperience === undefined ? null : d.yearsExperience,
          isAvailable: d.isAvailable === "on",
          skills: splitList(formData.get("skills"), 15),
          software: splitList(formData.get("software"), 10),
          languages: splitList(formData.get("languages"), 6),
        },
      },
    },
  });
  revalidatePath(`/freelances/${profile.slug}`);
  revalidatePath("/tableau-de-bord/profil");
  return { ok: true, message: "Profil enregistré." };
}

export async function updatePayoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await freelancer();
  const parsed = payoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (!PAYOUT_OPERATORS[parsed.data.payoutOperator]) return { fieldErrors: { payoutOperator: "Opérateur inconnu." } };

  await prisma.freelancerProfile.update({
    where: { id: profile.id },
    data: { payoutOperator: parsed.data.payoutOperator, payoutPhone: parsed.data.payoutPhone.replace(/\s+/g, "") },
  });
  revalidatePath("/tableau-de-bord/profil");
  return { ok: true, message: "Compte de reversement enregistré." };
}

export async function addPortfolioItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await freelancer();
  const parsed = portfolioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const count = await prisma.portfolioItem.count({ where: { profileId: profile.id } });
  if (count >= 24) return { error: "24 réalisations maximum." };

  await prisma.portfolioItem.create({
    data: { profileId: profile.id, ...parsed.data, description: parsed.data.description || null, position: count },
  });
  revalidatePath("/tableau-de-bord/profil");
  revalidatePath(`/freelances/${profile.slug}`);
  return { ok: true, message: "Réalisation ajoutée au portfolio." };
}

export async function deletePortfolioItemAction(formData: FormData) {
  const { profile } = await freelancer();
  await prisma.portfolioItem.deleteMany({ where: { id: String(formData.get("id")), profileId: profile.id } });
  await flash("success", "Réalisation supprimée.");
  revalidatePath("/tableau-de-bord/profil");
  revalidatePath(`/freelances/${profile.slug}`);
}

export async function updateClientProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return { error: "Réservé aux comptes client." };
  const parsed = clientProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { name, phone, ...company } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: phone || null,
      country: company.country,
      clientProfile: {
        upsert: {
          create: { ...company, sector: company.sector || null, city: company.city || null, about: company.about || null },
          update: { ...company, sector: company.sector || null, city: company.city || null, about: company.about || null },
        },
      },
    },
  });
  revalidatePath("/tableau-de-bord/profil");
  return { ok: true, message: "Profil entreprise enregistré." };
}
