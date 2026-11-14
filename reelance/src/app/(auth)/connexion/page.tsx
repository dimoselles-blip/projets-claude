import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "@/server/actions/auth";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormAlert, Input } from "@/components/ui/form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suivant?: string; reinitialise?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold">Bon retour 👋</h1>
      <p className="mt-2 text-ink-500">Connectez-vous à votre compte Reelance.</p>
      {sp.reinitialise && (
        <div className="mt-6">
          <FormAlert message="Mot de passe modifié. Vous pouvez vous connecter." />
        </div>
      )}
      <ActionForm action={loginAction} className="mt-8 space-y-4">
        {sp.suivant && <input type="hidden" name="suivant" value={sp.suivant} />}
        <FormField name="email" label="Adresse e-mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField name="password" label="Mot de passe">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </FormField>
        <div className="text-right">
          <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Mot de passe oublié ?
          </Link>
        </div>
        <FormStatus />
        <SubmitButton size="lg" className="w-full" pendingLabel="Connexion…">
          Se connecter
        </SubmitButton>
      </ActionForm>
      <p className="mt-8 text-center text-sm text-ink-600">
        Pas encore de compte ?{" "}
        <Link href={`/inscription${sp.suivant ? `?suivant=${encodeURIComponent(sp.suivant)}` : ""}`} className="font-semibold text-brand-700">
          Inscrivez-vous gratuitement
        </Link>
      </p>
    </>
  );
}
