import type { Metadata } from "next";
import { CircleCheck, CircleX } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { config, isCloudinaryConfigured, isFedapayConfigured } from "@/lib/config";
import { getSettings } from "@/lib/settings";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { refreshRatesAction, saveSettingsAction } from "@/server/actions/admin";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Checkbox, Input } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader, Table, Th, Td } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, rates] = await Promise.all([getSettings(), prisma.exchangeRate.findMany({ orderBy: { currency: "asc" } })]);
  const checks = [
    { label: `FedaPay (${config.fedapay.env === "live" ? "live" : "sandbox"}) — clé secrète`, ok: isFedapayConfigured() },
    { label: "FedaPay — secret du webhook", ok: Boolean(config.fedapay.webhookSecret) },
    { label: "Mode démo des paiements", ok: config.paymentSimulation, neutral: true },
    { label: "Cloudinary (upload d'images)", ok: isCloudinaryConfigured() },
    { label: "SMTP (e-mails transactionnels)", ok: Boolean(config.mail.host) },
    { label: "CRON_SECRET (validation auto, taux)", ok: Boolean(config.cron.secret) },
  ];

  return (
    <>
      <PageHeader title="Paramètres" description="Règles de la plateforme, devises et état de la configuration." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Règles de la marketplace" description="S'appliquent aux nouvelles commandes ; les commandes existantes gardent leurs conditions." />
          <CardBody>
            <ActionForm action={saveSettingsAction} className="space-y-4">
              <FormField name="commissionPercent" label="Commission Reelance (%)" hint="Retenue sur le montant reversé au freelance.">
                <Input id="commissionPercent" name="commissionPercent" type="number" step="0.5" min={0} max={50} defaultValue={settings.commissionRateBps / 100} />
              </FormField>
              <FormField name="autoCompleteDays" label="Validation automatique après livraison (jours)">
                <Input id="autoCompleteDays" name="autoCompleteDays" type="number" min={1} max={30} defaultValue={settings.autoCompleteDays} />
              </FormField>
              <FormField name="missionRevisions" label="Retouches incluses dans une mission">
                <Input id="missionRevisions" name="missionRevisions" type="number" min={0} max={10} defaultValue={settings.missionRevisions} />
              </FormField>
              <Checkbox name="requireServiceReview" defaultChecked={settings.requireServiceReview} label="Valider les services avant publication" />
              <Checkbox name="requireMissionReview" defaultChecked={settings.requireMissionReview} label="Valider les missions avant publication" />
              <FormStatus />
              <SubmitButton>Enregistrer</SubmitButton>
            </ActionForm>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Taux de change"
              description={`1 unité = x FCFA. EUR et XAF : parité fixe. Autres : ${config.exchangeRates.apiUrl.replace(/^https?:\/\//, "").split("/")[0]}, mis à jour toutes les ${config.exchangeRates.ttlHours} h.`}
              action={
                <form action={refreshRatesAction}>
                  <SubmitButton size="sm" variant="outline">
                    Actualiser
                  </SubmitButton>
                </form>
              }
            />
            <Table>
              <thead>
                <tr>
                  <Th>Devise</Th>
                  <Th>1 unité =</Th>
                  <Th>Source</Th>
                  <Th>Mise à jour</Th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.currency}>
                    <Td>
                      <span className="font-medium">{r.currency}</span> <span className="text-xs text-ink-500">{CURRENCIES[r.currency as CurrencyCode]?.label}</span>
                    </Td>
                    <Td>{Number(r.xofPerUnit).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} FCFA</Td>
                    <Td className="text-xs">{r.source}</Td>
                    <Td className="text-xs">{formatDate(r.updatedAt, true)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {rates.length === 0 && <p className="p-5 text-sm text-ink-500">Aucun taux enregistré : cliquez sur « Actualiser ».</p>}
          </Card>

          <Card>
            <CardHeader title="Configuration technique" description="Variables d'environnement (fichier .env)." />
            <CardBody>
              <ul className="space-y-2 text-sm">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-2">
                    {c.ok ? <CircleCheck className="size-4 text-emerald-600" /> : <CircleX className={c.neutral ? "size-4 text-ink-300" : "size-4 text-red-500"} />}
                    {c.label}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-ink-500">
                URL du webhook à déclarer dans FedaPay : <code className="rounded bg-ink-100 px-1.5 py-0.5">{config.appUrl}/api/webhooks/fedapay</code>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
