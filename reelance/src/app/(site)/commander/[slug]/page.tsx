import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { getCurrencyContext } from "@/lib/display-currency";
import { formatXof } from "@/lib/currency";
import { PACKAGE_TIERS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { createServiceOrderAction } from "@/server/actions/orders";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/form";
import { Card, CardBody } from "@/components/ui/card";
import { ServiceCover } from "@/components/services/ServiceCard";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Finaliser la commande" };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ offre?: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const { offre } = await searchParams;

  const service = await prisma.service.findUnique({
    where: { slug },
    include: { packages: true, category: { include: { parent: true } }, freelancer: { select: { name: true } } },
  });
  if (!service || service.status !== "PUBLISHED") notFound();

  if (user.role !== "CLIENT") {
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Commande réservée aux entreprises</h1>
        <p className="mt-3 text-ink-600">Votre compte est un compte {user.role === "ADMIN" ? "administrateur" : "freelance"}. Créez un compte client pour commander un service.</p>
        <LinkButton href={`/services/${slug}`} variant="outline" className="mt-6">
          Retour au service
        </LinkButton>
      </div>
    );
  }

  const pkg = service.packages.find((p) => p.tier === offre) ?? service.packages.find((p) => p.tier === "BASIC") ?? service.packages[0];
  if (!pkg) notFound();
  const tierLabel = PACKAGE_TIERS.find((t) => t.tier === pkg.tier)?.label;
  const [money, settings] = await Promise.all([getCurrencyContext(), getSettings()]);
  const foreign = money.currency !== "XOF" && money.currency !== "XAF";

  return (
    <div className="container-page max-w-5xl py-8 sm:py-12">
      <Link href={`/services/${slug}`} className="text-sm text-ink-500 hover:text-ink-900">
        ← Retour au service
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Finaliser votre commande</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardBody>
            <ActionForm action={createServiceOrderAction} className="space-y-5">
              <input type="hidden" name="serviceId" value={service.id} />
              <input type="hidden" name="tier" value={pkg.tier} />
              <FormField
                name="brief"
                label="Vos consignes pour le monteur"
                hint="Objectif de la vidéo, durée souhaitée, style, références, lien vers vos rushs (Drive, WeTransfer…), date de diffusion."
              >
                <Textarea id="brief" name="brief" rows={8} required placeholder="Ex. : vidéo YouTube de 12 min sur… Rushs disponibles ici : https://…" />
              </FormField>
              <FormStatus />
              <SubmitButton size="lg" className="w-full" pendingLabel="Redirection vers le paiement…">
                <Lock className="size-4" /> Payer {money.format(pkg.priceXof)}
              </SubmitButton>
              <p className="text-center text-xs text-ink-500">
                Vous allez être redirigé vers FedaPay (Mobile Money MTN, Moov, Celtiis ou carte bancaire).
                {foreign && <> Montant débité : {formatXof(pkg.priceXof)}.</>}
              </p>
            </ActionForm>
          </CardBody>
        </Card>

        <aside className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-[16/9]">
              <ServiceCover service={service} />
            </div>
            <CardBody className="space-y-4">
              <div>
                <p className="eyebrow text-xs!">Offre {tierLabel}</p>
                <p className="mt-1 font-semibold">{service.title}</p>
                <p className="text-sm text-ink-500">par {service.freelancer.name}</p>
              </div>
              <div className="flex gap-4 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" /> {pkg.deliveryDays} j
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="size-4" /> {pkg.revisions} retouche(s)
                </span>
              </div>
              <div className="space-y-1.5 border-t border-ink-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Prix de l&apos;offre</span>
                  <span className="font-medium">{money.format(pkg.priceXof)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Frais de service</span>
                  <span className="font-medium text-emerald-700">Offerts</span>
                </div>
                <div className="flex justify-between border-t border-ink-100 pt-3 text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-display font-bold">{money.format(pkg.priceXof)}</span>
                </div>
                {foreign && <p className="text-right text-xs text-ink-500">soit {formatXof(pkg.priceXof)} débités (taux indicatif)</p>}
              </div>
            </CardBody>
          </Card>
          <div className="flex gap-3 rounded-2xl border border-brand-300 bg-brand-50 p-4 text-sm text-ink-800">
            <ShieldCheck className="size-5 shrink-0 text-ink-950" />
            <p>
              Votre paiement reste bloqué sur Reelance. Vous validez la livraison (ou elle l&apos;est automatiquement après {settings.autoCompleteDays} jours sans réponse) avant que le monteur soit payé.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
