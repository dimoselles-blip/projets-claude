import { z } from "zod";

/** Schémas de validation partagés par les Server Actions. */

const text = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} : ${min} caractères minimum.`).max(max, `${label} : ${max} caractères maximum.`);

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Lien invalide (doit commencer par https://).")
  .transform((v) => (v ? v : null));

/** Lien http(s) obligatoire (refuse javascript:, data:, etc.). */
const httpUrl = (message: string) =>
  z
    .string()
    .trim()
    .max(500)
    .refine((v) => /^https?:\/\/[^\s]+$/i.test(v), message);

const priceXof = (label: string) =>
  z.coerce.number({ error: `${label} invalide.` }).int(`${label} : nombre entier en FCFA.`).min(1000, `${label} : 1 000 FCFA minimum.`).max(100_000_000, `${label} trop élevé.`);

export const registerSchema = z.object({
  role: z.enum(["FREELANCER", "CLIENT"], { error: "Choisissez un type de compte." }),
  name: text(2, 80, "Nom"),
  email: z.email("Adresse e-mail invalide.").trim().toLowerCase(),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum.").max(100),
  companyName: z.string().trim().max(120).optional(),
  country: z.string().trim().max(10).default("BJ"),
  acceptTerms: z.literal("on", { error: "Vous devez accepter les conditions d'utilisation." }),
});

export const loginSchema = z.object({
  email: z.email("Adresse e-mail invalide.").trim().toLowerCase(),
  password: z.string().min(1, "Mot de passe requis."),
});

export const freelancerProfileSchema = z.object({
  name: text(2, 80, "Nom"),
  headline: text(5, 120, "Titre du profil"),
  bio: text(30, 3000, "Présentation"),
  avatarUrl: optionalUrl,
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(10),
  phone: z.string().trim().max(30).optional(),
  dayRateXof: z.union([z.literal(""), z.coerce.number().int().min(0).max(10_000_000)]).optional(),
  yearsExperience: z.union([z.literal(""), z.coerce.number().int().min(0).max(60)]).optional(),
  isAvailable: z.string().optional(),
});

export const payoutSchema = z.object({
  payoutOperator: z.string().trim().min(1, "Choisissez un opérateur."),
  payoutPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{8,16}$/, "Numéro Mobile Money invalide."),
});

export const portfolioSchema = z.object({
  title: text(2, 100, "Titre"),
  description: z.string().trim().max(500).optional(),
  videoUrl: httpUrl("Lien vidéo invalide (https://…)."),
  thumbnailUrl: optionalUrl,
});

export const clientProfileSchema = z.object({
  name: text(2, 80, "Nom du contact"),
  companyName: text(2, 120, "Nom de l'entreprise"),
  sector: z.string().trim().max(80).optional(),
  companySize: z.string().trim().max(40).optional(),
  website: optionalUrl,
  logoUrl: optionalUrl,
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(10),
  phone: z.string().trim().max(30).optional(),
  about: z.string().trim().max(1500).optional(),
});

export const packageSchema = z.object({
  enabled: z.boolean(),
  name: text(2, 60, "Nom de l'offre"),
  description: z.string().trim().max(300).default(""),
  priceXof: priceXof("Prix"),
  deliveryDays: z.coerce.number().int().min(1, "Délai : 1 jour minimum.").max(90, "Délai : 90 jours maximum."),
  revisions: z.coerce.number().int().min(0).max(20),
  features: z.array(z.string().trim().max(80)).max(10),
});

export const serviceSchema = z.object({
  title: text(10, 100, "Titre"),
  description: text(80, 5000, "Description"),
  categoryId: z.string().min(1, "Choisissez une catégorie."),
  coverUrl: optionalUrl,
  videoUrl: optionalUrl,
  tags: z.array(z.string().trim().max(30)).max(8),
});

export const missionSchema = z
  .object({
    title: text(10, 120, "Titre"),
    description: text(60, 5000, "Description du besoin"),
    categoryId: z.string().min(1, "Choisissez une catégorie."),
    budgetMinXof: z.union([z.literal(""), priceXof("Budget minimum")]).optional(),
    budgetMaxXof: priceXof("Budget maximum"),
    deadline: z.union([z.literal(""), z.coerce.date()]).optional(),
    skills: z.array(z.string().trim().max(40)).max(10),
  })
  .refine((v) => !v.budgetMinXof || v.budgetMinXof <= v.budgetMaxXof, {
    path: ["budgetMinXof"],
    message: "Le budget minimum doit être inférieur au maximum.",
  });

export const applicationSchema = z.object({
  coverLetter: text(40, 3000, "Message"),
  priceXof: priceXof("Devis"),
  deliveryDays: z.coerce.number().int().min(1, "Délai : 1 jour minimum.").max(120),
});

export const orderBriefSchema = z.object({
  brief: text(20, 5000, "Consignes"),
});

export const deliverySchema = z.object({
  message: text(10, 3000, "Message de livraison"),
  links: z.array(httpUrl("Lien de livraison invalide (https://…).")).min(1, "Ajoutez au moins un lien de téléchargement.").max(10),
});

export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
