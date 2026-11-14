import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import type { CurrentUser } from "@/lib/auth/session";
import { COMPANY_SIZES, COUNTRIES, PAYOUT_OPERATORS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import {
  addPortfolioItemAction,
  deletePortfolioItemAction,
  updateClientProfileAction,
  updateFreelancerProfileAction,
  updatePayoutAction,
} from "@/server/actions/profile";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { SubmitButton } from "@/components/ui/submit-button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { FormAlert } from "@/components/ui/form";
import { VideoEmbed } from "@/components/VideoEmbed";

export const metadata: Metadata = { title: "Mon profil" };

function CountrySelect({ defaultValue }: { defaultValue: string }) {
  return (
    <Select id="country" name="country" defaultValue={defaultValue}>
      {Object.entries(COUNTRIES).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </Select>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const user = await requireUser(["FREELANCER", "CLIENT"]);
  const { bienvenue } = await searchParams;
  return user.role === "FREELANCER" ? <FreelancerProfileForm user={user} welcome={!!bienvenue} /> : <ClientProfileForm user={user} />;
}

async function FreelancerProfileForm({ user, welcome }: { user: CurrentUser; welcome: boolean }) {
  const profile = user.freelancerProfile!;
  const [portfolio, settings] = await Promise.all([
    prisma.portfolioItem.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } }),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Profil & portfolio"
        description="Un profil complet, avec des réalisations, inspire confiance aux entreprises."
        actions={
          <Link href={`/freelances/${profile.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            Voir mon profil public <ExternalLink className="size-4" />
          </Link>
        }
      />
      {welcome && (
        <div className="mb-6">
          <FormAlert message="Bienvenue sur Reelance ! Complétez votre profil, ajoutez vos réalisations et votre compte Mobile Money, puis publiez votre premier service." />
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader title="Informations du profil" />
          <CardBody>
            <ActionForm action={updateFreelancerProfileAction} className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField name="avatarUrl" label="Photo de profil">
                  <ImageUpload name="avatarUrl" defaultValue={profile.avatarUrl} folder="avatars" shape="round" label="Changer la photo" />
                </FormField>
              </div>
              <FormField name="name" label="Nom affiché">
                <Input id="name" name="name" defaultValue={user.name} />
              </FormField>
              <FormField name="headline" label="Titre du profil" hint="Ex. : Monteur YouTube & motion designer — 5 ans d'expérience">
                <Input id="headline" name="headline" defaultValue={profile.headline} maxLength={120} />
              </FormField>
              <FormField name="bio" label="Présentation" className="sm:col-span-2" hint="Votre parcours, votre style, les marques ou créateurs avec qui vous avez travaillé.">
                <Textarea id="bio" name="bio" rows={7} defaultValue={profile.bio} />
              </FormField>
              <FormField name="skills" label="Compétences" hint="Séparées par des virgules : montage dynamique, étalonnage, sous-titrage…">
                <Input id="skills" name="skills" defaultValue={profile.skills.join(", ")} />
              </FormField>
              <FormField name="software" label="Logiciels" hint="Premiere Pro, DaVinci Resolve, After Effects, CapCut…">
                <Input id="software" name="software" defaultValue={profile.software.join(", ")} />
              </FormField>
              <FormField name="languages" label="Langues">
                <Input id="languages" name="languages" defaultValue={profile.languages.join(", ")} />
              </FormField>
              <FormField name="phone" label="Téléphone (privé)">
                <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
              </FormField>
              <FormField name="city" label="Ville">
                <Input id="city" name="city" defaultValue={profile.city ?? ""} />
              </FormField>
              <FormField name="country" label="Pays">
                <CountrySelect defaultValue={profile.country} />
              </FormField>
              <FormField name="dayRateXof" label="Tarif journalier indicatif (FCFA)" hint="Facultatif. Converti automatiquement dans la devise du visiteur.">
                <Input id="dayRateXof" name="dayRateXof" type="number" min={0} step={500} defaultValue={profile.dayRateXof ?? ""} />
              </FormField>
              <FormField name="yearsExperience" label="Années d'expérience">
                <Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} defaultValue={profile.yearsExperience ?? ""} />
              </FormField>
              <div className="sm:col-span-2">
                <Checkbox name="isAvailable" defaultChecked={profile.isAvailable} label="Je suis disponible pour de nouveaux projets" />
              </div>
              <FormStatus className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Enregistrement…">Enregistrer le profil</SubmitButton>
              </div>
            </ActionForm>
          </CardBody>
        </Card>

        <Card id="portfolio" className="scroll-mt-24">
          <CardHeader title="Portfolio" description="Ajoutez vos meilleures réalisations (liens YouTube, Vimeo ou Google Drive)." />
          <CardBody className="space-y-6">
            {portfolio.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {portfolio.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-ink-100">
                    <VideoEmbed url={item.videoUrl} title={item.title} />
                    <div className="flex items-start justify-between gap-2 p-3">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.description && <p className="text-xs text-ink-500">{item.description}</p>}
                      </div>
                      <form action={deletePortfolioItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton variant="ghost" size="sm" confirm="Supprimer cette réalisation ?">
                          <Trash2 className="size-4 text-red-600" />
                          <span className="sr-only">Supprimer</span>
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ActionForm action={addPortfolioItemAction} resetOnSuccess className="grid gap-4 rounded-xl bg-ink-50 p-4 sm:grid-cols-2">
              <FormField name="title" label="Titre de la réalisation">
                <Input id="pf-title" name="title" placeholder="Ex. : Aftermovie Festival de Ouidah" />
              </FormField>
              <FormField name="videoUrl" label="Lien de la vidéo">
                <Input id="videoUrl" name="videoUrl" type="url" placeholder="https://youtube.com/…" />
              </FormField>
              <FormField name="description" label="Description (facultatif)" className="sm:col-span-2">
                <Input id="pf-description" name="description" maxLength={500} />
              </FormField>
              <FormStatus className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <SubmitButton variant="dark" pendingLabel="Ajout…">
                  Ajouter au portfolio
                </SubmitButton>
              </div>
            </ActionForm>
          </CardBody>
        </Card>

        <Card id="paiements" className="scroll-mt-24">
          <CardHeader
            title="Compte de reversement"
            description={`Vos gains sont reversés sur ce compte Mobile Money après validation de chaque commande (commission Reelance : ${settings.commissionRateBps / 100} %).`}
          />
          <CardBody>
            <ActionForm action={updatePayoutAction} className="grid gap-4 sm:grid-cols-2">
              <FormField name="payoutOperator" label="Opérateur">
                <Select id="payoutOperator" name="payoutOperator" defaultValue={profile.payoutOperator ?? ""}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {Object.entries(PAYOUT_OPERATORS).map(([key, op]) => (
                    <option key={key} value={key}>
                      {op.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField name="payoutPhone" label="Numéro Mobile Money" hint="Ex. : 01 97 00 00 00 (sans l'indicatif) ou +229…">
                <Input id="payoutPhone" name="payoutPhone" type="tel" defaultValue={profile.payoutPhone ?? ""} />
              </FormField>
              <FormStatus className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function ClientProfileForm({ user }: { user: CurrentUser }) {
  const c = user.clientProfile;
  return (
    <>
      <PageHeader title="Profil entreprise" description="Ces informations sont visibles par les freelances qui postulent à vos missions." />
      <Card>
        <CardBody>
          <ActionForm action={updateClientProfileAction} className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField name="logoUrl" label="Logo">
                <ImageUpload name="logoUrl" defaultValue={c?.logoUrl} folder="logos" shape="round" label="Changer le logo" />
              </FormField>
            </div>
            <FormField name="companyName" label="Nom de l'entreprise">
              <Input id="companyName" name="companyName" defaultValue={c?.companyName ?? ""} />
            </FormField>
            <FormField name="name" label="Nom du contact">
              <Input id="name" name="name" defaultValue={user.name} />
            </FormField>
            <FormField name="sector" label="Secteur d'activité">
              <Input id="sector" name="sector" defaultValue={c?.sector ?? ""} placeholder="Télécoms, banque, ONG, média…" />
            </FormField>
            <FormField name="companySize" label="Taille">
              <Select id="companySize" name="companySize" defaultValue={c?.companySize ?? ""}>
                <option value="">—</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} salariés
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField name="website" label="Site web">
              <Input id="website" name="website" type="url" defaultValue={c?.website ?? ""} placeholder="https://" />
            </FormField>
            <FormField name="phone" label="Téléphone">
              <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
            </FormField>
            <FormField name="city" label="Ville">
              <Input id="city" name="city" defaultValue={c?.city ?? ""} />
            </FormField>
            <FormField name="country" label="Pays">
              <CountrySelect defaultValue={c?.country ?? user.country} />
            </FormField>
            <FormField name="about" label="Présentation" className="sm:col-span-2">
              <Textarea id="about" name="about" rows={4} defaultValue={c?.about ?? ""} />
            </FormField>
            <FormStatus className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
            </div>
          </ActionForm>
        </CardBody>
      </Card>
    </>
  );
}
