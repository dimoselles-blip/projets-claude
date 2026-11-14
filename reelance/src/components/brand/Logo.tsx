import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo Reelance.
 * Quand le logo définitif sera livré : déposez-le dans /public/brand/logo.svg (et logo-white.svg pour les fonds sombres),
 * puis passez USE_BRAND_FILE à true. Le reste du site n'a pas besoin d'être modifié.
 */
const USE_BRAND_FILE = false;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-brand-600" />
      <path d="M12 9.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7l-10.2-6.5A1 1 0 0 0 12 9.5Z" fill="#fff" />
      <circle cx="25.5" cy="6.5" r="3" className="fill-accent-500" />
    </svg>
  );
}

export function Logo({ variant = "dark", className, href = "/" }: { variant?: "dark" | "light"; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)} aria-label="Reelance — accueil">
      {USE_BRAND_FILE ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={variant === "light" ? "/brand/logo-white.svg" : "/brand/logo.svg"} alt="Reelance" className="h-8 w-auto" />
      ) : (
        <>
          <LogoMark />
          <span className={cn("font-display text-[1.35rem] font-extrabold tracking-tight", variant === "light" ? "text-white" : "text-ink-900")}>
            Reelance
          </span>
        </>
      )}
    </Link>
  );
}
