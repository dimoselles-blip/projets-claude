import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { config, isFedapayConfigured } from "@/lib/config";
import { syncPaymentWithFedapay } from "@/lib/escrow";

/**
 * Retour du client après la page de paiement FedaPay (callback_url).
 * On ne se fie pas aux paramètres de l'URL : le statut est relu auprès de l'API FedaPay.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("paiement");
  const payment = paymentId ? await prisma.payment.findUnique({ where: { id: paymentId } }) : null;
  if (!payment) return NextResponse.redirect(new URL("/tableau-de-bord/commandes", config.appUrl));

  let status: string = payment.status;
  if (isFedapayConfigured() && payment.status === "PENDING") {
    try {
      status = (await syncPaymentWithFedapay(payment.id)) ?? status;
    } catch (err) {
      console.error("[paiement retour]", err);
    }
  }
  return NextResponse.redirect(new URL(`/tableau-de-bord/commandes/${payment.orderId}?paiement=${status}`, config.appUrl));
}
