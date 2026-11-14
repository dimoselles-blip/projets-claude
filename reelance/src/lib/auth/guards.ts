import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Role } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/session";

/** Exige une session ; redirige vers la connexion sinon. Optionnellement, restreint à certains rôles. */
export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    const path = (await headers()).get("x-pathname") ?? "/tableau-de-bord";
    redirect(`/connexion?suivant=${encodeURIComponent(path)}`);
  }
  if (roles && !roles.includes(user.role)) {
    redirect(user.role === "ADMIN" ? "/admin" : "/tableau-de-bord");
  }
  return user;
}

export const requireAdmin = () => requireUser(["ADMIN"]);

/** Pour les Server Actions : renvoie l'utilisateur ou lève une erreur (pas de redirection silencieuse). */
export async function assertUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Vous devez être connecté.");
  if (roles && !roles.includes(user.role)) throw new Error("Action non autorisée pour votre compte.");
  return user;
}
