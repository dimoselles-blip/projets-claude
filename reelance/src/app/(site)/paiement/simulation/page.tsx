import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { requireUser } from "@/lib/auth/guards";
import { formatXof } from "@/lib/currency";
import { simulatePaymentAction } from "@/server/actions/orders";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "Paiement (mode démo)" };

/** Page de paiement simulée : uniquement si PAYMENT_SIMULATION=true et sans clés FedaPay. */
export default async function SimulatedPaymentPage({ searchParams }: { searchParams: Promise<{ paiement?: string }> }) {
  if (!config.paymentSimulation) notFound();
  const user = await requireUser(["CLIENT"]);
  const { paiement } = await searchParams;
  const payment = await prisma.payment.findUnique({ where: { id: paiement ?? "" }, include: { order: true } });
  if (!payment || payment.order.clientId !== user.id) notFound();

  return (
    <div className="container-page max-w-lg py-16">
      <Card>
        <CardBody className="space-y-5 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
            <FlaskConical className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Paiement simulé</h1>
            <p className="mt-2 text-sm text-ink-600">
              Mode démo : FedaPay n&apos;est pas configuré. En production, le client est redirigé vers la page de paiement FedaPay.
            </p>
          </div>
          <p className="rounded-xl bg-ink-50 p-4 text-sm">
            {payment.order.title}
            <br />
            <strong className="font-display text-lg">{formatXof(payment.amountXof)}</strong>
          </p>
          <div className="flex flex-col gap-2">
            <form action={simulatePaymentAction}>
              <input type="hidden" name="paymentId" value={payment.id} />
              <input type="hidden" name="outcome" value="approved" />
              <SubmitButton variant="success" className="w-full">
                Simuler un paiement réussi
              </SubmitButton>
            </form>
            <form action={simulatePaymentAction}>
              <input type="hidden" name="paymentId" value={payment.id} />
              <input type="hidden" name="outcome" value="declined" />
              <SubmitButton variant="outline" className="w-full">
                Simuler un refus
              </SubmitButton>
            </form>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
