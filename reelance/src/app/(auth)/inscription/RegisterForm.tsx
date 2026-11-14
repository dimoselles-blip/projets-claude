"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Clapperboard } from "lucide-react";
import { registerAction } from "@/server/actions/auth";
import { ActionForm, FieldError, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Checkbox, Input, Select } from "@/components/ui/form";
import { COUNTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Role = "CLIENT" | "FREELANCER";

export function RegisterForm({ defaultRole, next }: { defaultRole: Role; next?: string }) {
  const [role, setRole] = useState<Role>(defaultRole);
  return (
    <ActionForm action={registerAction} className="space-y-4">
      {next && <input type="hidden" name="suivant" value={next} />}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-800">Je suis…</legend>
        <div className="grid grid-cols-2 gap-3">
          <RoleCard active={role === "CLIENT"} onClick={() => setRole("CLIENT")} icon={<Building2 className="size-5" />} title="Une entreprise" text="Je cherche un monteur" />
          <RoleCard active={role === "FREELANCER"} onClick={() => setRole("FREELANCER")} icon={<Clapperboard className="size-5" />} title="Un monteur" text="Je propose mes services" />
        </div>
        <input type="hidden" name="role" value={role} />
        <FieldError name="role" />
      </fieldset>

      <FormField name="name" label={role === "CLIENT" ? "Votre nom" : "Nom complet (affiché sur votre profil)"}>
        <Input id="name" name="name" autoComplete="name" required />
      </FormField>
      {role === "CLIENT" && (
        <FormField name="companyName" label="Nom de l'entreprise">
          <Input id="companyName" name="companyName" autoComplete="organization" />
        </FormField>
      )}
      <FormField name="email" label={role === "CLIENT" ? "E-mail professionnel" : "Adresse e-mail"}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </FormField>
      <FormField name="password" label="Mot de passe" hint="8 caractères minimum.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </FormField>
      <FormField name="country" label="Pays">
        <Select id="country" name="country" defaultValue="BJ">
          {Object.entries(COUNTRIES).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>
      <div>
        <Checkbox
          name="acceptTerms"
          label={
            <>
              J&apos;accepte les <Link href="/conditions" className="link-brand">conditions d&apos;utilisation</Link> de Reelance.
            </>
          }
        />
        <FieldError name="acceptTerms" />
      </div>
      <FormStatus />
      <SubmitButton size="lg" className="w-full" pendingLabel="Création du compte…">
        Créer mon compte {role === "FREELANCER" ? "freelance" : "entreprise"}
      </SubmitButton>
    </ActionForm>
  );
}

function RoleCard({ active, onClick, icon, title, text }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start rounded-2xl border-2 p-4 text-left transition",
        active ? "border-ink-950 bg-brand-50" : "border-ink-200 hover:border-ink-300",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-xl", active ? "bg-brand-400 text-ink-950" : "bg-ink-100 text-ink-600")}>{icon}</span>
      <span className="mt-3 text-sm font-semibold text-ink-900">{title}</span>
      <span className="text-xs text-ink-500">{text}</span>
    </button>
  );
}
