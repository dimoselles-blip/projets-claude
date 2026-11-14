import "server-only";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { formatXof } from "@/lib/currency";
import { esc, sendMail } from "@/lib/mail";

/** E-mails transactionnels. Les erreurs sont journalisées sans bloquer le flux métier. */

const orderUrl = (id: string) => `${config.appUrl}/tableau-de-bord/commandes/${id}`;

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: { client: true, freelancer: true } });
}

export async function notifyOrderPaid(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  await Promise.all([
    sendMail({
      to: order.freelancer.email,
      subject: `Nouvelle commande payée : ${order.title}`,
      title: "Vous avez une nouvelle commande 🎬",
      body: `<p>${esc(order.client.name)} a réglé la commande <b>${esc(order.reference)}</b> (« ${esc(order.title)} »).</p>
        <p>Les fonds (${formatXof(order.priceXof)}) sont bloqués en séquestre par Reelance et vous seront reversés après validation de la livraison. Vous recevrez <b>${formatXof(order.freelancerNetXof)}</b>.</p>`,
      cta: { label: "Voir la commande", url: orderUrl(order.id) },
    }),
    sendMail({
      to: order.client.email,
      subject: `Paiement confirmé — ${order.reference}`,
      title: "Paiement confirmé",
      body: `<p>Votre paiement pour « ${esc(order.title)} » est confirmé. Il reste bloqué sur Reelance jusqu'à ce que vous validiez la livraison.</p>`,
      cta: { label: "Suivre ma commande", url: orderUrl(order.id) },
    }),
  ]);
}

export async function notifyDelivered(orderId: string, autoCompleteDays: number) {
  const order = await loadOrder(orderId);
  if (!order) return;
  await sendMail({
    to: order.client.email,
    subject: `Livraison reçue — ${order.reference}`,
    title: "Votre vidéo est livrée",
    body: `<p>${esc(order.freelancer.name)} a livré la commande « ${esc(order.title)} ».</p>
      <p>Vérifiez la livraison puis validez-la, ou demandez une retouche. Sans réponse de votre part sous ${autoCompleteDays} jours, la commande sera validée automatiquement.</p>`,
    cta: { label: "Voir la livraison", url: orderUrl(order.id) },
  });
}

export async function notifyRevisionRequested(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  await sendMail({
    to: order.freelancer.email,
    subject: `Retouche demandée — ${order.reference}`,
    title: "Le client demande une retouche",
    body: `<p>${esc(order.client.name)} a demandé une retouche sur « ${esc(order.title)} ». Consultez ses remarques dans la commande.</p>`,
    cta: { label: "Voir la demande", url: orderUrl(order.id) },
  });
}

export async function notifyCompleted(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  await sendMail({
    to: order.freelancer.email,
    subject: `Commande validée — ${order.reference}`,
    title: "Commande validée ✅",
    body: `<p>La commande « ${esc(order.title)} » est validée. ${formatXof(order.freelancerNetXof)} vont vous être reversés sur votre compte Mobile Money.</p>`,
    cta: { label: "Voir mes paiements", url: `${config.appUrl}/tableau-de-bord/paiements` },
  });
}

export async function notifyApplicationAccepted(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  await sendMail({
    to: order.freelancer.email,
    subject: `Candidature retenue : ${order.title}`,
    title: "Votre candidature est retenue 🎉",
    body: `<p>${esc(order.client.name)} vous a choisi pour la mission « ${esc(order.title)} ». La mission démarre dès que le client a payé : vous serez prévenu par e-mail.</p>`,
    cta: { label: "Voir la commande", url: orderUrl(order.id) },
  });
}

export async function notifyNewApplication(missionId: string, freelancerName: string) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId }, include: { client: true } });
  if (!mission) return;
  await sendMail({
    to: mission.client.email,
    subject: `Nouvelle candidature : ${mission.title}`,
    title: "Nouvelle candidature",
    body: `<p>${esc(freelancerName)} a postulé à votre mission « ${esc(mission.title)} ».</p>`,
    cta: { label: "Voir les candidatures", url: `${config.appUrl}/tableau-de-bord/missions/${mission.id}` },
  });
}

export async function notifyPayoutSent(payoutId: string) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId }, include: { freelancer: true } });
  if (!payout) return;
  await sendMail({
    to: payout.freelancer.email,
    subject: "Reversement envoyé",
    title: "Votre paiement est en route 💸",
    body: `<p>Reelance vous a reversé <b>${formatXof(payout.amountXof)}</b>${payout.phone ? ` sur le ${payout.phone}` : ""}.</p>`,
    cta: { label: "Voir mes paiements", url: `${config.appUrl}/tableau-de-bord/paiements` },
  });
}

export function safely(promise: Promise<unknown>) {
  promise.catch((err) => console.error("[notifications]", err));
}
