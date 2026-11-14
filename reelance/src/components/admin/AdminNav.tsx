"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, FileText, FolderTree, Package, Scale, Settings, ShoppingBag, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: LucideIcon; badge?: "services" | "missions" | "disputes" | "payouts" }[] = [
  { href: "/admin", label: "Statistiques", icon: BarChart3 },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/services", label: "Services", icon: Package, badge: "services" },
  { href: "/admin/missions", label: "Missions", icon: FileText, badge: "missions" },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingBag },
  { href: "/admin/paiements", label: "Paiements & séquestre", icon: CreditCard, badge: "payouts" },
  { href: "/admin/litiges", label: "Litiges", icon: Scale, badge: "disputes" },
  { href: "/admin/categories", label: "Catégories", icon: FolderTree },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminNav({ counts }: { counts: Record<"services" | "missions" | "disputes" | "payouts", number> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Back office">
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 lg:hidden">
        {ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const count = item.badge ? counts[item.badge] : 0;
          return (
            <Link key={item.href} href={item.href} className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium", active ? "bg-brand-400 text-ink-950" : "bg-white/10 text-ink-200")}>
              <item.icon className="size-4" /> {item.label}
              {count > 0 && <span className="rounded-full bg-brand-400 px-1.5 text-xs font-semibold text-ink-950">{count}</span>}
            </Link>
          );
        })}
      </div>
      <ul className="hidden space-y-1 lg:block">
        {ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const count = item.badge ? counts[item.badge] : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white")}
              >
                <item.icon className={cn("size-[18px]", active && "text-brand-400")} /> <span className="flex-1">{item.label}</span>
                {count > 0 && <span className="rounded-full bg-brand-400 px-2 py-0.5 text-xs font-semibold text-ink-950">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
