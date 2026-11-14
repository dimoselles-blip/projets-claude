import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

/** Paramètres de la plateforme modifiables depuis le back office (table Setting). */
export const SETTING_DEFAULTS = {
  commissionRateBps: 1000, // 10 % retenus sur le montant reversé au freelance
  autoCompleteDays: 3, // validation automatique après livraison
  requireServiceReview: true, // un service doit être validé par l'admin avant publication
  requireMissionReview: true, // idem pour les missions
  missionRevisions: 2, // retouches incluses dans une mission
};

export type PlatformSettings = typeof SETTING_DEFAULTS;
export type SettingKey = keyof PlatformSettings;

function parse<K extends SettingKey>(key: K, raw: string): PlatformSettings[K] {
  const def = SETTING_DEFAULTS[key];
  if (typeof def === "boolean") return (raw === "true") as PlatformSettings[K];
  const n = Number(raw);
  return (Number.isFinite(n) ? n : def) as PlatformSettings[K];
}

export const getSettings = cache(async (): Promise<PlatformSettings> => {
  const rows = await prisma.setting.findMany();
  const settings = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    if (row.key in settings) {
      const key = row.key as SettingKey;
      (settings as Record<SettingKey, unknown>)[key] = parse(key, row.value);
    }
  }
  return settings;
});

export async function saveSettings(values: Partial<PlatformSettings>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
  }
}

/** Calcule la retenue Reelance (arrondie à l'unité FCFA). */
export function computeCommission(priceXof: number, rateBps: number) {
  const commissionXof = Math.round((priceXof * rateBps) / 10000);
  return { commissionXof, freelancerNetXof: priceXof - commissionXof };
}
