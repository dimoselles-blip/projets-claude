"use client";

import { useState } from "react";
import { saveServiceAction } from "@/server/actions/services";
import { ActionForm, FieldError, FormField, FormStatus } from "@/components/forms/ActionForm";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Pkg = { tier: "BASIC" | "STANDARD" | "PREMIUM"; name: string; description: string; priceXof: number; deliveryDays: number; revisions: number; features: string[] };

export type ServiceFormValues = {
  id?: string;
  title: string;
  description: string;
  categoryId: string;
  coverUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  packages: Pkg[];
  status?: string;
};

const TIERS = [
  { tier: "BASIC", label: "Essentiel", hint: "Votre offre de base (obligatoire)." },
  { tier: "STANDARD", label: "Standard", hint: "L'offre la plus choisie, avec plus de contenu." },
  { tier: "PREMIUM", label: "Premium", hint: "Votre prestation la plus complète." },
] as const;

export function ServiceForm({
  categories,
  initial,
  requireReview,
}: {
  categories: { id: string; name: string; children: { id: string; name: string }[] }[];
  initial?: ServiceFormValues;
  requireReview: boolean;
}) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    BASIC: true,
    STANDARD: Boolean(initial?.packages.find((p) => p.tier === "STANDARD")),
    PREMIUM: Boolean(initial?.packages.find((p) => p.tier === "PREMIUM")),
  });
  const pkg = (tier: string) => initial?.packages.find((p) => p.tier === tier);

  return (
    <ActionForm action={saveServiceAction} className="space-y-6">
      {initial?.id && <input type="hidden" name="serviceId" value={initial.id} />}

      <Card>
        <CardHeader title="Présentation" />
        <CardBody className="space-y-5">
          <FormField name="title" label="Titre du service" hint="Commencez par ce que vous livrez : « Je monte vos vidéos YouTube avec B-roll et sound design »">
            <Input id="title" name="title" defaultValue={initial?.title} maxLength={100} />
          </FormField>
          <FormField name="categoryId" label="Catégorie">
            <Select id="categoryId" name="categoryId" defaultValue={initial?.categoryId ?? ""}>
              <option value="" disabled>
                Choisir une catégorie…
              </option>
              {categories.map((c) =>
                c.children.length > 0 ? (
                  <optgroup key={c.id} label={c.name}>
                    {c.children.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ),
              )}
            </Select>
          </FormField>
          <FormField name="description" label="Description" hint="Ce qui est inclus, votre méthode, ce dont vous avez besoin de la part du client (rushs, charte, musique…). 80 caractères minimum.">
            <Textarea id="description" name="description" rows={9} defaultValue={initial?.description} />
          </FormField>
          <FormField name="tags" label="Mots-clés" hint="Jusqu'à 8, séparés par des virgules : youtube, vlog, sous-titres…">
            <Input id="tags" name="tags" defaultValue={initial?.tags.join(", ")} />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Visuels" description="Une image de couverture et, idéalement, une vidéo de démonstration." />
        <CardBody className="space-y-5">
          <FormField name="coverUrl" label="Image de couverture (16:9)">
            <ImageUpload name="coverUrl" defaultValue={initial?.coverUrl} folder="covers" />
          </FormField>
          <FormField name="videoUrl" label="Vidéo de démonstration (lien YouTube, Vimeo ou Drive)">
            <Input id="videoUrl" name="videoUrl" type="url" defaultValue={initial?.videoUrl ?? ""} placeholder="https://" />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Offres et prix"
          description="Saisissez vos prix en FCFA : ils sont convertis automatiquement dans la devise de chaque client (EUR, USD…)."
        />
        <CardBody className="grid gap-4 lg:grid-cols-3">
          {TIERS.map(({ tier, label, hint }) => {
            const p = pkg(tier);
            const on = enabled[tier];
            return (
              <div key={tier} className={cn("rounded-2xl border p-4", on ? "border-brand-200 bg-brand-50/30" : "border-dashed border-ink-200")}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{label}</p>
                  {tier !== "BASIC" && (
                    <label className="flex items-center gap-2 text-sm text-ink-600">
                      <input
                        type="checkbox"
                        name={`pkg_${tier}_enabled`}
                        checked={on}
                        onChange={(e) => setEnabled((s) => ({ ...s, [tier]: e.target.checked }))}
                        className="size-4 accent-brand-600"
                      />
                      Activer
                    </label>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-500">{hint}</p>
                {on && (
                  <div className="mt-4 space-y-3">
                    <PkgField tier={tier} field="name" label="Nom de l'offre">
                      <Input name={`pkg_${tier}_name`} defaultValue={p?.name ?? label} />
                    </PkgField>
                    <PkgField tier={tier} field="description" label="Résumé">
                      <Textarea name={`pkg_${tier}_description`} rows={2} defaultValue={p?.description} />
                    </PkgField>
                    <PkgField tier={tier} field="priceXof" label="Prix (FCFA)">
                      <Input name={`pkg_${tier}_price`} type="number" min={1000} step={500} inputMode="numeric" defaultValue={p?.priceXof} />
                    </PkgField>
                    <div className="grid grid-cols-2 gap-3">
                      <PkgField tier={tier} field="deliveryDays" label="Délai (j)">
                        <Input name={`pkg_${tier}_days`} type="number" min={1} max={90} defaultValue={p?.deliveryDays} />
                      </PkgField>
                      <PkgField tier={tier} field="revisions" label="Retouches">
                        <Input name={`pkg_${tier}_revisions`} type="number" min={0} max={20} defaultValue={p?.revisions ?? 1} />
                      </PkgField>
                    </div>
                    <PkgField tier={tier} field="features" label="Inclus (une ligne par élément)">
                      <Textarea name={`pkg_${tier}_features`} rows={4} defaultValue={p?.features.join("\n")} placeholder={"Vidéo jusqu'à 10 min\nSous-titres\nMusique libre de droits"} />
                    </PkgField>
                  </div>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>

      <FormStatus />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <SubmitButton name="intent" value="draft" variant="outline">
          Enregistrer le brouillon
        </SubmitButton>
        <SubmitButton name="intent" value="submit" pendingLabel="Envoi…">
          {requireReview ? "Envoyer en validation" : "Publier le service"}
        </SubmitButton>
      </div>
      {requireReview && <p className="text-right text-xs text-ink-500">Chaque service est relu par l&apos;équipe Reelance avant d&apos;apparaître dans le catalogue (sous 24 à 48 h).</p>}
    </ActionForm>
  );
}

function PkgField({ tier, field, label, children }: { tier: string; field: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-700">{label}</label>
      {children}
      <FieldError name={`pkg_${tier}_${field}`} />
    </div>
  );
}
