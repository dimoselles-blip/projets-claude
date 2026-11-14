import { CircleCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_20%,rgb(91_61_245/0.55),transparent_60%),radial-gradient(50%_50%_at_10%_90%,rgb(255_90_78/0.25),transparent_60%)]" />
        <div className="relative">
          <Logo variant="light" />
        </div>
        <div className="relative mt-auto max-w-lg">
          <h2 className="text-4xl leading-tight font-extrabold">Les vidéos qui font grandir les marques africaines.</h2>
          <ul className="mt-8 space-y-3 text-ink-300">
            {[
              "Des monteurs vérifiés, avec portfolio et tarifs clairs",
              "Paiement en séquestre : le freelance est payé à la validation",
              "Mobile Money, carte bancaire, prix dans votre devise",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CircleCheck className="size-5 text-brand-300" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </div>
  );
}
