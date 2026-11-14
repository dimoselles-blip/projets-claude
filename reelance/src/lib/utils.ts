import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Concatène des classes ; en cas de conflit (ex. « bg-white » puis « bg-transparent »), la dernière l'emporte. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length = 5) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function orderReference(date = new Date()) {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `RL-${y}${m}${d}-${randomCode(5)}`;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatDate(date: Date | string | null | undefined, withTime = false) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Porto-Novo",
  }).format(new Date(date));
}

export function formatRelative(date: Date | string) {
  const diff = new Date(date).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  const months = Math.round(days / 30);
  return rtf.format(months, "month");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Découpe une saisie « une valeur par ligne ou séparée par des virgules ». */
export function splitList(value: FormDataEntryValue | null | undefined, max = 20) {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0]!, lastname: parts[0]! };
  return { firstname: parts.slice(0, -1).join(" "), lastname: parts[parts.length - 1]! };
}
