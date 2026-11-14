import type { Metadata } from "next";
import Link from "next/link";
import { forgotPasswordAction } from "@/server/actions/auth";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-ink-500">Indiquez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <ActionForm action={forgotPasswordAction} className="mt-8 space-y-4">
        <FormField name="email" label="Adresse e-mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormStatus />
        <SubmitButton size="lg" className="w-full" pendingLabel="Envoi…">
          Envoyer le lien
        </SubmitButton>
      </ActionForm>
      <p className="mt-8 text-center text-sm">
        <Link href="/connexion" className="font-semibold text-brand-700">
          ← Retour à la connexion
        </Link>
      </p>
    </>
  );
}
