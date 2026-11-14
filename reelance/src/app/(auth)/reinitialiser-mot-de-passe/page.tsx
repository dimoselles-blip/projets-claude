import type { Metadata } from "next";
import { resetPasswordAction } from "@/server/actions/auth";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  const { jeton } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>
      <p className="mt-2 text-ink-500">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>
      <ActionForm action={resetPasswordAction} className="mt-8 space-y-4">
        <input type="hidden" name="jeton" value={jeton ?? ""} />
        <FormField name="password" label="Nouveau mot de passe">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </FormField>
        <FormStatus />
        <SubmitButton size="lg" className="w-full" pendingLabel="Enregistrement…">
          Enregistrer
        </SubmitButton>
      </ActionForm>
    </>
  );
}
