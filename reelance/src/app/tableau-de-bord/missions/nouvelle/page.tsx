import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { getCategoryTree } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { createMissionAction } from "@/server/actions/missions";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Publier une mission" };

export default async function NewMissionPage() {
  await requireUser(["CLIENT"]);
  const [categories, settings] = await Promise.all([getCategoryTree(), getSettings()]);

  return (
    <>
      <PageHeader title="Publier une mission" description="Plus votre besoin est précis, plus les devis seront pertinents." />
      <Card>
        <CardBody>
          <ActionForm action={createMissionAction} className="grid gap-5 sm:grid-cols-2">
            <FormField name="title" label="Titre de la mission" className="sm:col-span-2" hint="Ex. : Montage de 4 vidéos Reels par mois pour une marque de cosmétiques">
              <Input id="title" name="title" maxLength={120} />
            </FormField>
            <FormField name="categoryId" label="Catégorie" className="sm:col-span-2">
              <Select id="categoryId" name="categoryId" defaultValue="">
                <option value="" disabled>
                  Choisir…
                </option>
                {categories.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name} (général)</option>
                    {c.children.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </FormField>
            <FormField
              name="description"
              label="Description du besoin"
              className="sm:col-span-2"
              hint="Objectif, public visé, durée et format (16:9, 9:16…), nombre de vidéos, rushs disponibles, style, références, échéances."
            >
              <Textarea id="description" name="description" rows={9} />
            </FormField>
            <FormField name="budgetMinXof" label="Budget minimum (FCFA, facultatif)">
              <Input id="budgetMinXof" name="budgetMinXof" type="number" min={1000} step={1000} inputMode="numeric" />
            </FormField>
            <FormField name="budgetMaxXof" label="Budget maximum (FCFA)">
              <Input id="budgetMaxXof" name="budgetMaxXof" type="number" min={1000} step={1000} inputMode="numeric" />
            </FormField>
            <FormField name="deadline" label="Date de livraison souhaitée (facultatif)">
              <Input id="deadline" name="deadline" type="date" />
            </FormField>
            <FormField name="skills" label="Compétences recherchées" hint="Séparées par des virgules : After Effects, étalonnage, sous-titrage…">
              <Input id="skills" name="skills" />
            </FormField>
            <FormStatus className="sm:col-span-2" />
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-500">
                {settings.requireMissionReview ? "Votre mission sera relue par l'équipe Reelance avant publication." : "Votre mission sera publiée immédiatement."} Vous ne payez qu&apos;au moment de retenir un freelance.
              </p>
              <SubmitButton pendingLabel="Publication…">Publier la mission</SubmitButton>
            </div>
          </ActionForm>
        </CardBody>
      </Card>
    </>
  );
}
