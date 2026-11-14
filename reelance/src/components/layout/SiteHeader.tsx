import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Search, ShieldCheck, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { MobileMenu, MobileNavLink } from "@/components/layout/MobileMenu";
import { getCurrentUser } from "@/lib/auth/session";
import { getDisplayCurrency } from "@/lib/display-currency";
import { logoutAction } from "@/server/actions/auth";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/freelances", label: "Monteurs" },
  { href: "/missions", label: "Missions" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
];

export async function SiteHeader() {
  const [user, currency] = await Promise.all([getCurrentUser(), getDisplayCurrency()]);
  const dashboardHref = user?.role === "ADMIN" ? "/admin" : "/tableau-de-bord";

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/services" className="relative ml-auto hidden max-w-xs flex-1 xl:block" role="search">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            name="q"
            type="search"
            placeholder="Montage YouTube, clip, motion…"
            aria-label="Rechercher un service"
            className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 pr-3 pl-9 text-sm placeholder:text-ink-400 focus:border-ink-950 focus:bg-white focus:shadow-none focus:outline-none focus:ring-4 focus:ring-brand-300/60"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <CurrencySwitcher current={currency} className="hidden sm:block" />

          {user ? (
            <>
              <LinkButton href={dashboardHref} variant="outline" size="sm" className="hidden md:inline-flex">
                {user.role === "ADMIN" ? <ShieldCheck className="size-4" /> : <LayoutDashboard className="size-4" />}
                {user.role === "ADMIN" ? "Back office" : "Tableau de bord"}
              </LinkButton>
              <details className="group relative hidden lg:block">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl p-1 hover:bg-ink-50 [&::-webkit-details-marker]:hidden">
                  <Avatar name={user.name} src={user.freelancerProfile?.avatarUrl ?? user.clientProfile?.logoUrl} size={34} />
                  <ChevronDown className="size-4 text-ink-500 transition group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-ink-100 bg-white p-2 shadow-card-hover">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                  </div>
                  <Link href={dashboardHref} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-ink-50">
                    <LayoutDashboard className="size-4" /> {user.role === "ADMIN" ? "Back office" : "Tableau de bord"}
                  </Link>
                  {user.role !== "ADMIN" && (
                    <Link href="/tableau-de-bord/profil" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-ink-50">
                      <UserRound className="size-4" /> Mon profil
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="size-4" /> Se déconnecter
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <LinkButton href="/connexion" variant="ghost" size="sm">
                Connexion
              </LinkButton>
              <LinkButton href="/inscription" size="sm">
                Inscription
              </LinkButton>
            </div>
          )}

          <MobileMenu>
            <form action="/services" className="relative mb-4" role="search">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
              <input name="q" type="search" placeholder="Rechercher un service" className="h-12 w-full rounded-xl border border-ink-200 bg-ink-50 pr-3 pl-9" />
            </form>
            <nav className="flex flex-col" aria-label="Navigation mobile">
              {NAV.map((item) => (
                <MobileNavLink key={item.href} href={item.href}>
                  {item.label}
                </MobileNavLink>
              ))}
            </nav>
            <div className="my-4 flex items-center justify-between rounded-xl bg-ink-50 px-3 py-3">
              <span className="text-sm text-ink-600">Devise</span>
              <CurrencySwitcher current={currency} />
            </div>
            {user ? (
              <div className="flex flex-col gap-2">
                <LinkButton href={dashboardHref} size="lg">
                  {user.role === "ADMIN" ? "Back office" : "Mon tableau de bord"}
                </LinkButton>
                <form action={logoutAction}>
                  <button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">
                    Se déconnecter
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <LinkButton href="/inscription" size="lg">
                  Créer un compte
                </LinkButton>
                <LinkButton href="/connexion" variant="outline" size="lg">
                  Connexion
                </LinkButton>
              </div>
            )}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
