import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string; suivant?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold">Créer un compte</h1>
      <p className="mt-2 text-ink-500">Gratuit, sans engagement. Votre espace est prêt en une minute.</p>
      <div className="mt-8">
        <RegisterForm defaultRole={sp.role === "FREELANCER" ? "FREELANCER" : "CLIENT"} next={sp.suivant} />
      </div>
      <p className="mt-8 text-center text-sm text-ink-600">
        Déjà inscrit ?{" "}
        <Link href={`/connexion${sp.suivant ? `?suivant=${encodeURIComponent(sp.suivant)}` : ""}`} className="link-brand">
          Connectez-vous
        </Link>
      </p>
    </>
  );
}
