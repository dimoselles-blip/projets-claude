import "server-only";
import { prisma } from "@/lib/db";
import { config, isFedapayConfigured } from "@/lib/config";
import { splitName } from "@/lib/utils";
import { createTransaction, generatePaymentLink } from "@/lib/fedapay";
import { getSettings, computeCommission } from "@/lib/settings";
import { getRates } from "@/lib/rates";
import { convertFromXof, type CurrencyCode } from "@/lib/currency";
import type { CurrentUser } from "@/lib/auth/session";

/** Montants figés d'une nouvelle commande : commission en vigueur + devise du client. */
export async function priceSnapshot(priceXof: number, currency: CurrencyCode) {
  const [settings, rates] = await Promise.all([getSettings(), getRates()]);
  const { commissionXof, freelancerNetXof } = computeCommission(priceXof, settings.commissionRateBps);
  return {
    priceXof,
    commissionRateBps: settings.commissionRateBps,
    commissionXof,
    freelancerNetXof,
    displayCurrency: currency,
    displayAmount: convertFromXof(priceXof, currency, rates),
    xofPerUnit: rates[currency],
  };
}

/**
 * Crée une transaction FedaPay pour une commande et renvoie l'URL de paiement hébergée
 * (Mobile Money MTN/Moov/Celtiis, carte bancaire…). Le montant débité est en FCFA.
 */
export async function startPayment(orderId: string, user: CurrentUser) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.clientId !== user.id) throw new Error("Commande introuvable.");
  if (order.status !== "AWAITING_PAYMENT") throw new Error("Cette commande est déjà payée ou annulée.");

  const payment = await prisma.payment.create({ data: { orderId, amountXof: order.priceXof } });

  if (!isFedapayConfigured()) {
    if (config.paymentSimulation) return `/paiement/simulation?paiement=${payment.id}`;
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "CANCELED" } });
    throw new Error("Le paiement en ligne n'est pas encore activé sur la plateforme.");
  }

  const { firstname, lastname } = splitName(user.name);
  const transaction = await createTransaction({
    amountXof: order.priceXof,
    description: `Reelance ${order.reference} — ${order.title}`,
    callbackUrl: `${config.appUrl}/api/paiements/retour?paiement=${payment.id}`,
    customer: { firstname, lastname, email: user.email },
  });
  const link = await generatePaymentLink(transaction.id);

  await prisma.payment.update({
    where: { id: payment.id },
    data: { fedapayTransactionId: String(transaction.id), fedapayReference: transaction.reference, paymentUrl: link.url },
  });
  return link.url;
}
