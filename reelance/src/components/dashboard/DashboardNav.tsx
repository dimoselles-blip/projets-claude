"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
  Send,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV: Record<"FREELANCER" | "CLIENT", Item[]> = {
  FREELANCER: [
    { href: "/tableau-de-bord", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
    { href: "/tableau-de-bord/commandes", label: "Commandes", icon: ShoppingBag },
    { href: "/tableau-de-bord/services", label: "Mes services", icon: Package },
    { href: "/tableau-de-bord/candidatures", label: "Candidatures", icon: Send },
    { href: "/tableau-de-bord/paiements", label: "Paiements", icon: CreditCard },
    { href: "/tableau-de-bord/profil", label: "Profil & portfolio", icon: UserRound },
    { href: "/missions", label: "Missions ouvertes", icon: Search },
  ],
  CLIENT: [
    { href: "/tableau-de-bord", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
    { href: "/tableau-de-bord/commandes", label: "Commandes", icon: ShoppingBag },
    { href: "/tableau-de-bord/missions", label: "Mes missions", icon: FileText },
    { href: "/tableau-de-bord/missions/nouvelle", label: "Publier une mission", icon: PlusCircle, exact: true },
    { href: "/tableau-de-bord/profil", label: "Profil entreprise", icon: UserRound },
    { href: "/services", label: "Trouver un service", icon: Search },
  ],
};

export function DashboardNav({ role }: { role: "FREELANCER" | "CLIENT" }) {
  const pathname = usePathname();
  const items = NAV[role];
  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname === item.href || (pathname.startsWith(`${item.href}/`) && !items.some((o) => o !== item && o.href.startsWith(item.href) && pathname.startsWith(o.href)));

  return (
    <nav aria-label="Navigation du tableau de bord">
      {/* Mobile : barre défilante */}
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 lg:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium",
              isActive(item) ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-700",
            )}
          >
            <item.icon className="size-4" /> {item.label}
          </Link>
        ))}
      </div>
      {/* Ordinateur : colonne */}
      <ul className="hidden space-y-1 lg:block">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive(item) ? "bg-brand-400 font-semibold text-ink-950" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
              )}
            >
              <item.icon className="size-[18px]" /> {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
