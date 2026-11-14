import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CalendarClock, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrencyContext } from "@/lib/display-currency";
import { APPLICATION_STATUS, COUNTRIES, MISSION_STATUS } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/utils";
import { applyToMissionAction } from "@/server/actions/missions";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Textarea } from "@/components/ui/form";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Price } from "@/components/Price";

type Params = Promise<{ id: string }>;

async function load(id: string) {
  return prisma.mission.findUnique({
    where: { id },
    include: {
      category: { include: { parent: true } },
      client: { select: { id: true, name: true, clientProfile: true } },
      _count: { select: { applications: { where: { status: { not: "WITHDRAWN" } } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const m = await load((await params).id);
  return m ? { title: m.title } : {};
}

export default async function MissionPage({ params }: { params: Params }) {
  const { id } = await params;
  const [mission, user] = await Promise.all([load(id), getCurrentUser()]);
  if (!mission) notFound();
  const isOwner = user?.id === mission.clientId;
  if (mission.status !== "OPEN" && !isOwner && user?.role !== "ADMIN") notFound();

  const myApplication =
    user?.role === "FREELANCER"
      ? await prisma.application.findUnique({ where: { missionId_freelancerId: { missionId: mission.id, freelancerId: user.id } } })
      : null;
  const { currency, rates } = await getCurrencyContext();
  const company = mission.client.clientProfile;

  return (
    <div className="container-page py-8 sm:py-12">
      <Link href="/missions" className="text-sm text-ink-500 hover:text-ink-900">
        ← Toutes les missions
      </Link>
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{mission.category.parent ? `${mission.category.parent.name} · ${mission.category.name}` : mission.category.name}</Badge>
            {mission.status !== "OPEN" && <StatusBadge status={mission.status} map={MISSION_STATUS} />}
            <span className="text-sm text-ink-500">Publiée {formatRelative(mission.publishedAt ?? mission.createdAt)}</span>
          </div>
          <h1 className="mt-3 text-2xl leading-tight font-bold sm:text-3xl">{mission.title}</h1>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Fact label="Budget">
              {mission.budgetMinXof ? (
                <>
                  <Price xof={mission.budgetMinXof} /> – <Price xof={mission.budgetMaxXof} />
                </>
              ) : (
                <>
                  Jusqu&apos;à <Price xof={mission.budgetMaxXof} />
                </>
              )}
            </Fact>
            <Fact label="Échéance">{mission.deadline ? formatDate(mission.deadline) : "Flexible"}</Fact>
            <Fact label="Candidatures">{mission._count.applications}</Fact>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold">Description du besoin</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-700">{mission.description}</p>
          </section>
          {mission.skills.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold">Compétences recherchées</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {mission.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </section>
          )}
          <section className="mt-8 rounded-2xl border border-ink-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-500">
              <Building2 className="size-4" /> Le client
            </h2>
            <p className="mt-2 font-semibold">{company?.companyName ?? mission.client.name}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
              <MapPin className="size-3.5" />
              {[company?.city, company ? COUNTRIES[company.country] : null].filter(Boolean).join(", ") || "—"}
              {company?.sector && <> · {company.sector}</>}
            </p>
          </section>
        </div>

        <aside>
          <div className="sticky top-24">
            {isOwner ? (
              <Card>
                <CardBody className="space-y-3">
                  <p className="font-semibold">C&apos;est votre mission</p>
                  <p className="text-sm text-ink-600">Consultez les candidatures reçues et retenez un monteur depuis votre tableau de bord.</p>
                  <LinkButton href={`/tableau-de-bord/missions/${mission.id}`} className="w-full">
                    <Users className="size-4" /> Voir les candidatures
                  </LinkButton>
                </CardBody>
              </Card>
            ) : !user ? (
              <Card>
                <CardBody className="space-y-3">
                  <p className="font-semibold">Intéressé par cette mission ?</p>
                  <p className="text-sm text-ink-600">Créez votre profil de monteur gratuitement pour envoyer votre devis.</p>
                  <LinkButton href={`/inscription?role=FREELANCER&suivant=/missions/${mission.id}`} className="w-full">
                    Postuler
                  </LinkButton>
                  <LinkButton href={`/connexion?suivant=/missions/${mission.id}`} variant="outline" className="w-full">
                    J&apos;ai déjà un compte
                  </LinkButton>
                </CardBody>
              </Card>
            ) : user.role !== "FREELANCER" ? (
              <Card>
                <CardBody className="text-sm text-ink-600">Seuls les comptes freelance peuvent postuler aux missions.</CardBody>
              </Card>
            ) : myApplication && myApplication.status !== "WITHDRAWN" ? (
              <Card>
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Votre candidature</p>
                    <StatusBadge status={myApplication.status} map={APPLICATION_STATUS} />
                  </div>
                  <p className="text-sm text-ink-600">
                    Devis : <Price xof={myApplication.priceXof} className="font-semibold text-ink-900" /> · {myApplication.deliveryDays} jour(s)
                  </p>
                  <LinkButton href="/tableau-de-bord/candidatures" variant="outline" className="w-full">
                    Mes candidatures
                  </LinkButton>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader title="Envoyer ma candidature" description="Le client compare les messages, les devis et vos portfolios." />
                <CardBody>
                  <ActionForm action={applyToMissionAction} className="space-y-4">
                    <input type="hidden" name="missionId" value={mission.id} />
                    <FormField name="coverLetter" label="Votre message">
                      <Textarea id="coverLetter" name="coverLetter" rows={6} placeholder="Présentez votre approche, vos réalisations similaires, ce dont vous avez besoin…" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField name="priceXof" label="Devis (FCFA)" hint={currency !== "XOF" ? `1 ${currency} ≈ ${Math.round(rates[currency])} FCFA` : undefined}>
                        <Input id="priceXof" name="priceXof" type="number" min={1000} step={500} inputMode="numeric" />
                      </FormField>
                      <FormField name="deliveryDays" label="Délai (jours)">
                        <Input id="deliveryDays" name="deliveryDays" type="number" min={1} max={120} inputMode="numeric" />
                      </FormField>
                    </div>
                    <p className="text-xs text-ink-500">Une commission Reelance est retenue sur le montant qui vous est reversé (voir votre tableau de bord).</p>
                    <FormStatus />
                    <SubmitButton className="w-full" pendingLabel="Envoi…">
                      Envoyer ma candidature
                    </SubmitButton>
                  </ActionForm>
                </CardBody>
              </Card>
            )}
            {mission.deadline && (
              <p className="mt-3 flex items-center gap-2 px-1 text-sm text-ink-500">
                <CalendarClock className="size-4" /> Livraison attendue avant le {formatDate(mission.deadline)}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-ink-50 px-4 py-3">
      <p className="text-xs font-medium text-ink-500 uppercase">{label}</p>
      <p className="mt-1 font-semibold text-ink-900">{children}</p>
    </div>
  );
}
