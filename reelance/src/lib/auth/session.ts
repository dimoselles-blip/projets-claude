import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { generateToken, hashToken } from "@/lib/auth/tokens";

/**
 * Sessions stockées en base : le cookie contient un jeton aléatoire,
 * la base n'en garde que l'empreinte SHA-256 (un vol de base ne permet pas d'usurper une session).
 */
export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + config.session.maxAgeDays * 24 * 3600 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 250) ?? null;

  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt, userAgent } });
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });

  (await cookies()).set(config.session.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(config.session.cookieName)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(config.session.cookieName);
}

/** Utilisateur connecté (ou null), mis en cache pour la durée de la requête. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(config.session.cookieName)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { freelancerProfile: true, clientProfile: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.status !== "ACTIVE") return null;

  const { passwordHash: _ignored, ...user } = session.user;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
