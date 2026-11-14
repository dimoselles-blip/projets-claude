import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo Reelance (fichiers vectoriels dans /public/brand).
 * - « dark »  : lettres noires, pour fonds clairs (logo.svg)
 * - « light » : lettres blanches, pour fonds sombres (logo-white.svg)
 * Les « ee » restent toujours jaunes (#F2E924).
 */
export function Logo({
  variant = "dark",
  className,
  href = "/",
  size = "md",
}: {
  variant?: "dark" | "light";
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const height = { sm: "h-6", md: "h-7 sm:h-8", lg: "h-10 sm:h-12" }[size];
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)} aria-label="Reelance — accueil">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={variant === "light" ? "/brand/logo-white.svg" : "/brand/logo.svg"} alt="Reelance" className={cn(height, "w-auto")} />
    </Link>
  );
}

/** Symbole « ee » seul (icône d'application, avatars de marque, petits formats). */
export function LogoIcon({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/icon.svg" alt="" aria-hidden className={cn("size-8 rounded-lg", className)} />;
}
