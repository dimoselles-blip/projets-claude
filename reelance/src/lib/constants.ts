import type {
  ApplicationStatus,
  DisputeStatus,
  EscrowStatus,
  MissionStatus,
  OrderStatus,
  PackageTier,
  PaymentStatus,
  PayoutStatus,
  ServiceStatus,
} from "@/generated/prisma/enums";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  AWAITING_PAYMENT: { label: "En attente de paiement", tone: "warning" },
  IN_PROGRESS: { label: "En cours", tone: "brand" },
  DELIVERED: { label: "Livrée — à valider", tone: "info" },
  REVISION_REQUESTED: { label: "Retouche demandée", tone: "warning" },
  COMPLETED: { label: "Terminée", tone: "success" },
  DISPUTED: { label: "En litige", tone: "danger" },
  CANCELLED: { label: "Annulée", tone: "neutral" },
  REFUNDED: { label: "Remboursée", tone: "neutral" },
};

export const SERVICE_STATUS: Record<ServiceStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  PENDING_REVIEW: { label: "En validation", tone: "warning" },
  PUBLISHED: { label: "Publié", tone: "success" },
  REJECTED: { label: "Refusé", tone: "danger" },
  PAUSED: { label: "En pause", tone: "neutral" },
};

export const MISSION_STATUS: Record<MissionStatus, { label: string; tone: Tone }> = {
  PENDING_REVIEW: { label: "En validation", tone: "warning" },
  OPEN: { label: "Ouverte", tone: "success" },
  IN_PROGRESS: { label: "En cours", tone: "brand" },
  COMPLETED: { label: "Terminée", tone: "neutral" },
  CANCELLED: { label: "Annulée", tone: "neutral" },
  REJECTED: { label: "Refusée", tone: "danger" },
};

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "En attente", tone: "warning" },
  ACCEPTED: { label: "Retenue", tone: "success" },
  REJECTED: { label: "Non retenue", tone: "neutral" },
  WITHDRAWN: { label: "Retirée", tone: "neutral" },
};

export const ESCROW_STATUS: Record<EscrowStatus, { label: string; tone: Tone }> = {
  HELD: { label: "Bloqué en séquestre", tone: "info" },
  RELEASABLE: { label: "À reverser", tone: "warning" },
  RELEASING: { label: "Reversement en cours", tone: "brand" },
  RELEASED: { label: "Reversé", tone: "success" },
  REFUNDED: { label: "Remboursé au client", tone: "neutral" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "En attente", tone: "warning" },
  APPROVED: { label: "Payé", tone: "success" },
  DECLINED: { label: "Refusé", tone: "danger" },
  CANCELED: { label: "Annulé", tone: "neutral" },
  REFUNDED: { label: "Remboursé", tone: "neutral" },
};

export const PAYOUT_STATUS: Record<PayoutStatus, { label: string; tone: Tone }> = {
  PROCESSING: { label: "En cours", tone: "brand" },
  SENT: { label: "Envoyé", tone: "success" },
  FAILED: { label: "Échec", tone: "danger" },
};

export const DISPUTE_STATUS: Record<DisputeStatus, { label: string; tone: Tone }> = {
  OPEN: { label: "Ouvert", tone: "danger" },
  RESOLVED_FOR_FREELANCER: { label: "Tranché pour le freelance", tone: "success" },
  RESOLVED_FOR_CLIENT: { label: "Tranché pour le client", tone: "neutral" },
};

export const PACKAGE_TIERS: { tier: PackageTier; label: string }[] = [
  { tier: "BASIC", label: "Essentiel" },
  { tier: "STANDARD", label: "Standard" },
  { tier: "PREMIUM", label: "Premium" },
];

/**
 * Opérateurs Mobile Money pour les reversements FedaPay (Payouts).
 * `mode` = valeur envoyée à l'API FedaPay. Vérifiez la liste des modes activés
 * sur votre compte dans le tableau de bord FedaPay avant la mise en production.
 */
export const PAYOUT_OPERATORS: Record<string, { label: string; mode: string; country: string }> = {
  MTN_BJ: { label: "MTN MoMo Bénin", mode: "mtn_open", country: "bj" },
  MOOV_BJ: { label: "Moov Money Bénin", mode: "moov", country: "bj" },
  CELTIIS_BJ: { label: "Celtiis Cash Bénin", mode: "sbin", country: "bj" },
  MOOV_TG: { label: "Moov Money Togo", mode: "moov_tg", country: "tg" },
  TOGOCEL_TG: { label: "Mixx by Yas Togo", mode: "togocel", country: "tg" },
  MTN_CI: { label: "MTN MoMo Côte d'Ivoire", mode: "mtn_ci", country: "ci" },
  ORANGE_CI: { label: "Orange Money Côte d'Ivoire", mode: "orange_ci", country: "ci" },
  ORANGE_SN: { label: "Orange Money Sénégal", mode: "orange_sn", country: "sn" },
};

export const COUNTRIES: Record<string, string> = {
  BJ: "Bénin",
  TG: "Togo",
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BF: "Burkina Faso",
  ML: "Mali",
  NE: "Niger",
  GN: "Guinée",
  CM: "Cameroun",
  GA: "Gabon",
  CD: "RD Congo",
  CG: "Congo",
  MA: "Maroc",
  TN: "Tunisie",
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  CA: "Canada",
  US: "États-Unis",
  GB: "Royaume-Uni",
  OTHER: "Autre pays",
};

export const COMPANY_SIZES = ["1 à 10", "11 à 50", "51 à 200", "201 à 1000", "Plus de 1000"];
