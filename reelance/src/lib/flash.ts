import "server-only";
import { cookies } from "next/headers";

/** Messages « flash » affichés une fois après une action (cookie court, lu puis effacé côté client). */
export const FLASH_COOKIE = "rl_flash";

export type Flash = { type: "success" | "error"; message: string };

export async function flash(type: Flash["type"], message: string) {
  const value = Buffer.from(JSON.stringify({ type, message }), "utf8").toString("base64url");
  (await cookies()).set(FLASH_COOKIE, value, { path: "/", maxAge: 30, sameSite: "lax", httpOnly: false });
}

export async function readFlash(): Promise<Flash | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Flash;
  } catch {
    return null;
  }
}

export function errorMessage(err: unknown, fallback = "Une erreur est survenue. Réessayez.") {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
