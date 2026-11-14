import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { verifyWebhookSignature } from "@/lib/fedapay";
import { syncPaymentWithFedapay, syncPayoutFromWebhook } from "@/lib/escrow";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Webhook FedaPay — URL à déclarer dans FedaPay (Paramètres → Webhooks) :
 *   https://votre-domaine/api/webhooks/fedapay
 * Événements utiles : transaction.approved, transaction.declined, transaction.canceled,
 * payout.sent, payout.failed (cochez « tous les événements » si besoin).
 *
 * Sécurité : la signature (en-tête X-FEDAPAY-SIGNATURE) est vérifiée avec FEDAPAY_WEBHOOK_SECRET,
 * puis le statut de la transaction est relu auprès de l'API FedaPay avant toute écriture.
 */
export const dynamic = "force-dynamic";

type FedapayEvent = {
  name?: string;
  type?: string;
  entity?: { id?: number | string; status?: string; klass?: string; last_error_message?: string | null };
  object_id?: number | string;
};

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-fedapay-signature");

  if (!verifyWebhookSignature(raw, signature, config.fedapay.webhookSecret)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  let event: FedapayEvent;
  try {
    event = JSON.parse(raw) as FedapayEvent;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const name = event.name ?? event.type ?? "unknown";
  const objectId = String(event.entity?.id ?? event.object_id ?? "");
  const log = await prisma.webhookEvent.create({
    data: { provider: "FEDAPAY", eventName: name, objectId: objectId || null, payload: event as Prisma.InputJsonValue },
  });

  try {
    if (name.startsWith("transaction.") && objectId) {
      const payment = await prisma.payment.findUnique({ where: { fedapayTransactionId: objectId } });
      if (payment) await syncPaymentWithFedapay(payment.id);
    } else if (name.startsWith("payout.") && objectId && event.entity?.status) {
      await syncPayoutFromWebhook(objectId, event.entity.status, event.entity.last_error_message);
    }
    await prisma.webhookEvent.update({ where: { id: log.id }, data: { processed: true } });
  } catch (err) {
    console.error("[webhook fedapay]", err);
    await prisma.webhookEvent.update({ where: { id: log.id }, data: { error: err instanceof Error ? err.message : String(err) } });
    // 500 => FedaPay renverra l'événement plus tard.
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
