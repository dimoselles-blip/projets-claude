import Link from "next/link";
import {
  CalendarClock,
  CircleCheck,
  ExternalLink,
  FileText,
  Hourglass,
  Lock,
  PackageCheck,
  Scale,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Textarea } from "@/components/ui/form";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { DISPUTE_STATUS, ESCROW_STATUS, ORDER_STATUS, PAYMENT_STATUS, PAYOUT_STATUS } from "@/lib/constants";
import { formatMoney, formatXof } from "@/lib/currency";
import { formatDate, formatRelative } from "@/lib/utils";
import {
  acceptDeliveryAction,
  cancelOrderAction,
  deliverOrderAction,
  openDisputeAction,
  payOrderAction,
  requestRevisionAction,
} from "@/server/actions/orders";
import { adminCompleteOrderAction, adminRefundOrderAction, resolveDisputeAction } from "@/server/actions/admin";
import type { Prisma } from "@/generated/prisma/client";

export const orderDetailInclude = {
  client: { select: { id: true, name: true, email: true, clientProfile: { select: { companyName: true, logoUrl: true } } } },
  freelancer: { select: { id: true, name: true, email: true, freelancerProfile: { select: { slug: true, avatarUrl: true, payoutPhone: true, payoutOperator: true } } } },
  service: { select: { slug: true, title: true } },
  mission: { select: { id: true, title: true } },
  deliveries: { orderBy: { createdAt: "desc" } },
  events: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
  escrow: { include: { payouts: { orderBy: { createdAt: "desc" } } } },
  payments: { orderBy: { createdAt: "desc" } },
  dispute: { include: { openedBy: { select: { name: true } } } },
} satisfies Prisma.OrderInclude;

export type OrderDetailData = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

type Viewer = "CLIENT" | "FREELANCER" | "ADMIN";

export function OrderDetail({
  order,
  viewer,
  paymentReturn,
  autoCompleteDays,
}: {
  order: OrderDetailData;
  viewer: Viewer;
  paymentReturn?: string;
  autoCompleteDays: number;
}) {
  const clientName = order.client.clientProfile?.companyName ?? order.client.name;
  const canDispute = viewer !== "ADMIN" && ["IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"].includes(order.status);
  const revisionsLeft = order.revisionsAllowed - order.revisionsUsed;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-ink-500">
            Commande {order.reference} · {order.type === "MISSION" ? "Mission" : "Service"} · créée le {formatDate(order.createdAt)}
          </p>
          <h1 className="mt-1 text-2xl leading-tight font-bold sm:text-3xl">{order.title}</h1>
        </div>
        <StatusBadge status={order.status} map={ORDER_STATUS} />
      </div>

      <PaymentReturnBanner status={paymentReturn} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* ───── Actions selon le rôle et le statut ───── */}
          <NextStep order={order} viewer={viewer} autoCompleteDays={autoCompleteDays} revisionsLeft={revisionsLeft} />

          {viewer === "ADMIN" && <AdminPanel order={order} />}

          {/* ───── Livraisons ───── */}
          {order.deliveries.length > 0 && (
            <Card>
              <CardHeader title="Livraisons" description={`${order.deliveries.length} livraison(s) · ${order.revisionsUsed}/${order.revisionsAllowed} retouche(s) utilisée(s)`} />
              <ul className="divide-y divide-ink-100">
                {order.deliveries.map((d, i) => (
                  <li key={d.id} className="px-5 py-5 sm:px-6">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-semibold">
                        <PackageCheck className="size-4 text-brand-600" /> Livraison n°{order.deliveries.length - i}
                      </p>
                      <span className="text-xs text-ink-500">{formatDate(d.createdAt, true)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-700">{d.message}</p>
                    <ul className="mt-3 space-y-1.5">
                      {d.links.map((l) => (
                        <li key={l}>
                          <a href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium break-all text-brand-700 hover:underline">
                            <ExternalLink className="size-3.5 shrink-0" /> {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ───── Brief ───── */}
          <Card>
            <CardHeader title="Consignes du client" />
            <CardBody>
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink-700">{order.brief || "—"}</p>
              {order.service && (
                <Link href={`/services/${order.service.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  <FileText className="size-4" /> Voir le service commandé
                </Link>
              )}
              {order.mission && (
                <Link href={`/missions/${order.mission.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  <FileText className="size-4" /> Voir la mission
                </Link>
              )}
            </CardBody>
          </Card>

          {canDispute && (
            <details className="group rounded-2xl border border-ink-100 bg-white">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-medium text-ink-600 hover:text-ink-900 sm:px-6 [&::-webkit-details-marker]:hidden">
                <Scale className="size-4" /> Un problème avec cette commande ? Ouvrir un litige
              </summary>
              <div className="border-t border-ink-100 px-5 py-5 sm:px-6">
                <p className="mb-4 text-sm text-ink-600">
                  L&apos;équipe Reelance examinera la commande et tranchera. Pendant le litige, les fonds restent bloqués et la validation automatique est suspendue.
                </p>
                <ActionForm action={openDisputeAction} className="space-y-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <FormField name="reason" label="Expliquez le problème">
                    <Textarea id="reason" name="reason" rows={4} />
                  </FormField>
                  <FormStatus />
                  <SubmitButton variant="danger" confirm="Confirmer l'ouverture d'un litige ?">
                    Ouvrir un litige
                  </SubmitButton>
                </ActionForm>
              </div>
            </details>
          )}

          {/* ───── Historique ───── */}
          <Card>
            <CardHeader title="Historique" />
            <ol className="relative space-y-5 px-5 py-5 sm:px-6">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-sm text-ink-800">{e.message}</p>
                    <p className="text-xs text-ink-500">
                      {formatDate(e.createdAt, true)}
                      {e.actor ? ` · ${e.actor.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* ───── Récapitulatif ───── */}
        <aside className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <Party label="Client" name={clientName} src={order.client.clientProfile?.logoUrl} />
              <Party
                label="Freelance"
                name={order.freelancer.name}
                src={order.freelancer.freelancerProfile?.avatarUrl}
                href={order.freelancer.freelancerProfile ? `/freelances/${order.freelancer.freelancerProfile.slug}` : undefined}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Montants" />
            <CardBody className="space-y-2 text-sm">
              {viewer === "CLIENT" ? (
                <>
                  <Row label="Prix" value={formatMoney(Number(order.displayAmount), order.displayCurrency)} strong />
                  {order.displayCurrency !== "XOF" && <Row label="Débité via FedaPay" value={formatXof(order.priceXof)} />}
                </>
              ) : (
                <>
                  <Row label="Prix payé par le client" value={formatXof(order.priceXof)} />
                  <Row label={`Commission Reelance (${order.commissionRateBps / 100} %)`} value={`− ${formatXof(order.commissionXof)}`} />
                  <Row label={viewer === "FREELANCER" ? "Vous recevez" : "Net freelance"} value={formatXof(order.freelancerNetXof)} strong />
                  {order.displayCurrency !== "XOF" && <Row label="Devise du client" value={formatMoney(Number(order.displayAmount), order.displayCurrency)} />}
                </>
              )}
              {order.escrow && (
                <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="flex items-center gap-1.5 text-ink-600">
                    <Lock className="size-4" /> Séquestre
                  </span>
                  <StatusBadge status={order.escrow.status} map={ESCROW_STATUS} />
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Dates clés" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Délai prévu" value={`${order.deliveryDays} jour(s)`} />
              <Row label="Payée le" value={formatDate(order.paidAt, true)} />
              {order.dueAt && <Row label="Livraison attendue" value={formatDate(order.dueAt)} />}
              {order.deliveredAt && <Row label="Dernière livraison" value={formatDate(order.deliveredAt, true)} />}
              {order.autoCompleteAt && order.status === "DELIVERED" && <Row label="Validation automatique" value={formatDate(order.autoCompleteAt, true)} />}
              {order.completedAt && <Row label="Terminée le" value={`${formatDate(order.completedAt)}${order.completedAutomatically ? " (auto)" : ""}`} />}
            </CardBody>
          </Card>

          {order.dispute && (
            <Card className="border-red-200">
              <CardHeader title="Litige" action={<StatusBadge status={order.dispute.status} map={DISPUTE_STATUS} />} />
              <CardBody className="space-y-2 text-sm">
                <p className="text-ink-700">
                  <span className="font-medium">{order.dispute.openedBy.name}</span> : {order.dispute.reason}
                </p>
                {order.dispute.resolutionNote && <p className="rounded-lg bg-ink-50 p-3 text-ink-700">Décision : {order.dispute.resolutionNote}</p>}
              </CardBody>
            </Card>
          )}

          <p className="flex gap-2 px-1 text-xs text-ink-500">
            <ShieldCheck className="size-4 shrink-0" /> Les fonds sont conservés par Reelance jusqu&apos;à la validation de la livraison.
          </p>
        </aside>
      </div>
    </div>
  );
}

function NextStep({ order, viewer, autoCompleteDays, revisionsLeft }: { order: OrderDetailData; viewer: Viewer; autoCompleteDays: number; revisionsLeft: number }) {
  // Client — paiement
  if (order.status === "AWAITING_PAYMENT") {
    if (viewer !== "CLIENT") {
      return <Notice icon={<Hourglass className="size-5" />} title="En attente du paiement du client" text="La commande démarrera dès que le client aura payé. Les fonds seront alors bloqués en séquestre." />;
    }
    return (
      <Card className="border-brand-200">
        <CardBody>
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="size-5 text-brand-600" /> Réglez la commande pour la démarrer
          </p>
          <p className="mt-2 text-sm text-ink-600">
            Paiement sécurisé par FedaPay (Mobile Money ou carte). Montant : <strong>{formatMoney(Number(order.displayAmount), order.displayCurrency)}</strong>
            {order.displayCurrency !== "XOF" && <> (soit {formatXof(order.priceXof)})</>}. Le freelance n&apos;est payé qu&apos;après votre validation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={payOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <SubmitButton pendingLabel="Redirection…">Payer maintenant</SubmitButton>
            </form>
            <form action={cancelOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <SubmitButton variant="ghost" confirm="Annuler cette commande ?">
                Annuler la commande
              </SubmitButton>
            </form>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Freelance — livraison
  if (["IN_PROGRESS", "REVISION_REQUESTED"].includes(order.status)) {
    if (viewer !== "FREELANCER") {
      return (
        <Notice
          icon={<Hourglass className="size-5" />}
          title={order.status === "REVISION_REQUESTED" ? "Retouche en cours" : "Le freelance travaille sur votre vidéo"}
          text={order.dueAt ? `Livraison attendue au plus tard le ${formatDate(order.dueAt)}. Vous serez prévenu par e-mail.` : "Vous serez prévenu par e-mail à la livraison."}
        />
      );
    }
    const lastRevision = order.events.find((e) => e.type === "REVISION_REQUESTED");
    return (
      <Card className="border-brand-200">
        <CardHeader
          title={order.status === "REVISION_REQUESTED" ? "Livrer la version retouchée" : "Livrer la commande"}
          description={order.dueAt ? `À livrer avant le ${formatDate(order.dueAt)} (${formatRelative(order.dueAt)}).` : undefined}
        />
        <CardBody>
          {order.status === "REVISION_REQUESTED" && lastRevision && (
            <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Demande du client</p>
              <p className="mt-1 whitespace-pre-line">{lastRevision.message.replace(/^Retouche demandée : /, "")}</p>
            </div>
          )}
          <ActionForm action={deliverOrderAction} className="space-y-4" resetOnSuccess>
            <input type="hidden" name="orderId" value={order.id} />
            <FormField name="message" label="Message au client">
              <Textarea id="message" name="message" rows={4} placeholder="Présentez votre livraison, les choix réalisés, les formats fournis…" />
            </FormField>
            <FormField name="links" label="Liens de téléchargement" hint="Un lien par ligne : WeTransfer, Google Drive, Dropbox, Vimeo privé…">
              <Textarea id="links" name="links" rows={3} placeholder="https://…" />
            </FormField>
            <FormStatus />
            <SubmitButton pendingLabel="Envoi…">
              <PackageCheck className="size-4" /> Envoyer la livraison
            </SubmitButton>
          </ActionForm>
        </CardBody>
      </Card>
    );
  }

  // Client — validation
  if (order.status === "DELIVERED") {
    if (viewer !== "CLIENT") {
      return (
        <Notice
          icon={<CalendarClock className="size-5" />}
          title="Livraison envoyée — en attente de validation"
          text={order.autoCompleteAt ? `Sans réponse du client, la commande sera validée automatiquement le ${formatDate(order.autoCompleteAt, true)}.` : "En attente de la validation du client."}
        />
      );
    }
    return (
      <Card className="border-emerald-200">
        <CardBody>
          <p className="flex items-center gap-2 font-semibold">
            <PackageCheck className="size-5 text-emerald-600" /> Votre vidéo est livrée : vérifiez-la
          </p>
          <p className="mt-2 text-sm text-ink-600">
            Si tout est conforme, validez la livraison : le freelance sera payé. Sinon, demandez une retouche ({revisionsLeft} restante{revisionsLeft > 1 ? "s" : ""}).
            {order.autoCompleteAt && <> Sans réponse, validation automatique le {formatDate(order.autoCompleteAt, true)} ({autoCompleteDays} jours après la livraison).</>}
          </p>
          <form action={acceptDeliveryAction} className="mt-4">
            <input type="hidden" name="orderId" value={order.id} />
            <SubmitButton variant="success" confirm="Valider la livraison ? Le paiement sera débloqué pour le freelance.">
              <CircleCheck className="size-4" /> Valider la livraison
            </SubmitButton>
          </form>
          {revisionsLeft > 0 && (
            <details className="mt-4 rounded-xl border border-ink-100">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink-700">Demander une retouche</summary>
              <div className="border-t border-ink-100 p-4">
                <ActionForm action={requestRevisionAction} className="space-y-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <FormField name="message" label="Retouches souhaitées">
                    <Textarea id="message-revision" name="message" rows={4} placeholder="Ex. : raccourcir l'intro, changer la musique à 1:20, ajouter le logo en fin de vidéo…" />
                  </FormField>
                  <FormStatus />
                  <SubmitButton variant="outline">Envoyer la demande</SubmitButton>
                </ActionForm>
              </div>
            </details>
          )}
        </CardBody>
      </Card>
    );
  }

  if (order.status === "DISPUTED") {
    return <Notice tone="danger" icon={<Scale className="size-5" />} title="Litige en cours" text="L'équipe Reelance examine la commande. Les fonds restent bloqués jusqu'à sa décision." />;
  }
  if (order.status === "COMPLETED") {
    const payout = order.escrow?.payouts.find((p) => p.status === "SENT");
    return (
      <Notice
        tone="success"
        icon={<CircleCheck className="size-5" />}
        title="Commande terminée"
        text={
          viewer === "FREELANCER"
            ? payout
              ? `Paiement de ${formatXof(payout.amountXof)} reversé le ${formatDate(payout.sentAt)}.`
              : `Votre paiement de ${formatXof(order.freelancerNetXof)} est en cours de reversement sur votre compte Mobile Money.`
            : "Merci ! La livraison est validée."
        }
      />
    );
  }
  if (order.status === "REFUNDED") {
    return <Notice icon={<TriangleAlert className="size-5" />} title="Commande remboursée" text="Le client a été remboursé suite à la décision de l'équipe Reelance." />;
  }
  return <Notice icon={<TriangleAlert className="size-5" />} title="Commande annulée" text="Cette commande a été annulée avant paiement." />;
}

function AdminPanel({ order }: { order: OrderDetailData }) {
  const canForce = ["IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED", "DISPUTED"].includes(order.status) && order.escrow?.status === "HELD";
  return (
    <Card className="border-ink-900/10 bg-ink-50/50">
      <CardHeader title="Administration" description={`${order.client.email} → ${order.freelancer.email}`} />
      <CardBody className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold">Paiements FedaPay</p>
          {order.payments.length === 0 ? (
            <p className="text-sm text-ink-500">Aucune tentative de paiement.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {order.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-ink-600">
                    {formatDate(p.createdAt, true)} · #{p.fedapayTransactionId ?? "—"} {p.mode ? `· ${p.mode}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    {formatXof(p.amountXof)} <StatusBadge status={p.status} map={PAYMENT_STATUS} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {order.escrow && order.escrow.payouts.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold">Reversements</p>
            <ul className="space-y-1.5 text-sm">
              {order.escrow.payouts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-ink-600">
                    {formatDate(p.createdAt, true)} · {p.method === "MANUAL" ? "Manuel" : `FedaPay #${p.fedapayPayoutId ?? "—"}`} {p.failureReason ? `· ${p.failureReason}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    {formatXof(p.amountXof)} <StatusBadge status={p.status} map={PAYOUT_STATUS} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {order.dispute?.status === "OPEN" && (
          <div className="rounded-xl border border-red-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-red-700">Trancher le litige</p>
            <ActionForm action={resolveDisputeAction} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <FormField name="note" label="Décision motivée (visible par les deux parties)">
                <Textarea id="note" name="note" rows={3} />
              </FormField>
              <FormStatus />
              <div className="flex flex-wrap gap-2">
                <SubmitButton name="outcome" value="FREELANCER" variant="success" confirm="Payer le freelance ?">
                  En faveur du freelance (payer)
                </SubmitButton>
                <SubmitButton name="outcome" value="CLIENT" variant="danger" confirm="Rembourser le client ?">
                  En faveur du client (rembourser)
                </SubmitButton>
              </div>
            </ActionForm>
          </div>
        )}

        {canForce && !order.dispute && (
          <div className="flex flex-wrap gap-2">
            <form action={adminCompleteOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <SubmitButton variant="outline" size="sm" confirm="Valider la commande à la place du client ?">
                Forcer la validation
              </SubmitButton>
            </form>
            <form action={adminRefundOrderAction} className="flex gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <Input name="note" placeholder="Motif du remboursement" className="h-9 w-56 text-sm" />
              <SubmitButton variant="outline" size="sm" confirm="Marquer la commande comme remboursée ?">
                Rembourser le client
              </SubmitButton>
            </form>
          </div>
        )}
        {order.events.some((e) => e.type === "PAYMENT_LATE") && (
          <Badge tone="danger">Paiement reçu après annulation : remboursement à faire dans FedaPay</Badge>
        )}
      </CardBody>
    </Card>
  );
}

function PaymentReturnBanner({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { tone: string; text: string }> = {
    APPROVED: { tone: "border-emerald-200 bg-emerald-50 text-emerald-800", text: "Paiement confirmé ! Les fonds sont bloqués en séquestre et le freelance a été prévenu." },
    PENDING: { tone: "border-amber-200 bg-amber-50 text-amber-900", text: "Paiement en cours de confirmation par FedaPay. Cette page se mettra à jour dès réception." },
    DECLINED: { tone: "border-red-200 bg-red-50 text-red-700", text: "Le paiement a été refusé. Vous pouvez réessayer." },
    CANCELED: { tone: "border-ink-200 bg-ink-50 text-ink-700", text: "Paiement annulé. Vous pouvez réessayer quand vous le souhaitez." },
  };
  const m = map[status] ?? map.PENDING!;
  return <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${m.tone}`}>{m.text}</div>;
}

function Notice({ icon, title, text, tone = "neutral" }: { icon: React.ReactNode; title: string; text: string; tone?: "neutral" | "success" | "danger" }) {
  const tones = { neutral: "border-ink-100 bg-white", success: "border-emerald-200 bg-emerald-50/60", danger: "border-red-200 bg-red-50/60" };
  return (
    <div className={`flex gap-3 rounded-2xl border p-5 ${tones[tone]}`}>
      <span className="text-brand-600">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-ink-600">{text}</p>
      </div>
    </div>
  );
}

function Party({ label, name, src, href }: { label: string; name: string; src?: string | null; href?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={src} size={40} />
      <div>
        <p className="text-xs text-ink-500">{label}</p>
        <p className="font-semibold text-ink-900">{name}</p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-80">{content}</Link> : content;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-600">{label}</span>
      <span className={strong ? "font-display text-base font-bold text-ink-900" : "font-medium text-ink-900"}>{value}</span>
    </div>
  );
}
