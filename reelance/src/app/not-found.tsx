import { LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 font-display text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-bold">Cette page est introuvable</h1>
      <p className="mt-2 text-ink-500">Elle a peut-être été déplacée, ou n&apos;est pas (encore) publiée.</p>
      <LinkButton href="/" className="mt-8">
        Retour à l&apos;accueil
      </LinkButton>
    </div>
  );
}
