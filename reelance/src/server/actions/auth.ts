"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { loginSchema, registerSchema, toFieldErrors } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { slugify, randomCode } from "@/lib/utils";
import { getDisplayCurrency } from "@/lib/display-currency";
import type { ActionState } from "@/lib/action-state";

function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
}

async function uniqueFreelancerSlug(name: string) {
  const base = slugify(name) || "monteur";
  let slug = base;
  while (await prisma.freelancerProfile.findUnique({ where: { slug } })) {
    slug = `${base}-${randomCode(4).toLowerCase()}`;
  }
  return slug;
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: "Trop de tentatives. Réessayez dans une heure." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Veuillez corriger les champs indiqués.", fieldErrors: toFieldErrors(parsed.error) };
  const data = parsed.data;

  if (data.role === "CLIENT" && (!data.companyName || data.companyName.length < 2)) {
    return { fieldErrors: { companyName: "Indiquez le nom de votre entreprise." } };
  }
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    return { fieldErrors: { email: "Un compte existe déjà avec cette adresse." } };
  }

  const currency = await getDisplayCurrency();
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: await hashPassword(data.password),
      name: data.name,
      role: data.role,
      country: data.country,
      currency,
      ...(data.role === "FREELANCER"
        ? { freelancerProfile: { create: { slug: await uniqueFreelancerSlug(data.name), country: data.country, skills: [], software: [], languages: ["Français"] } } }
        : { clientProfile: { create: { companyName: data.companyName!, country: data.country } } }),
    },
  });

  await createSession(user.id);
  redirect(safeNext(formData.get("suivant")) ?? (data.role === "FREELANCER" ? "/tableau-de-bord/profil?bienvenue=1" : "/tableau-de-bord?bienvenue=1"));
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  if (!rateLimit(`login:${await clientIp()}:${email}`, 8, 15 * 60 * 1000)) {
    return { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  if (user.status === "SUSPENDED") {
    return { error: "Ce compte est suspendu. Contactez l'équipe Reelance." };
  }

  await createSession(user.id);
  redirect(safeNext(formData.get("suivant")) ?? (user.role === "ADMIN" ? "/admin" : "/tableau-de-bord"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const done: ActionState = {
    ok: true,
    message: "Si un compte existe avec cette adresse, vous allez recevoir un lien de réinitialisation.",
  };
  if (!email || !rateLimit(`forgot:${await clientIp()}`, 5, 60 * 60 * 1000)) return done;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.status === "ACTIVE") {
    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await sendMail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe Reelance",
      title: "Réinitialiser votre mot de passe",
      body: "<p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable 1 heure.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>",
      cta: { label: "Choisir un nouveau mot de passe", url: `${config.appUrl}/reinitialiser-mot-de-passe?jeton=${token}` },
    });
  }
  return done;
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("jeton") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { fieldErrors: { password: "Mot de passe : 8 caractères minimum." } };

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  redirect("/connexion?reinitialise=1");
}
