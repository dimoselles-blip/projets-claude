import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { config } from "@/lib/config";
import { logoutAction } from "@/server/actions/auth";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: { default: "Back office", template: "%s · Back office Reelance" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [services, missions, disputes, payouts] = await Promise.all([
    prisma.service.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.mission.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.escrow.count({ where: { status: "RELEASABLE" } }),
  ]);

  return (
    <div className="min-h-dvh bg-ink-50 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="bg-ink-950 px-4 py-5 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:px-5">
        <div className="mb-5 flex items-center justify-between">
          <Logo variant="light" href="/admin" />
          <Badge tone={config.fedapay.env === "live" ? "success" : "warning"} className="lg:hidden">
            {config.fedapay.env === "live" ? "Live" : "Sandbox"}
          </Badge>
        </div>
        <AdminNav counts={{ services, missions, disputes, payouts }} />
        <div className="mt-auto hidden space-y-3 border-t border-white/10 pt-4 text-sm lg:block">
          <p className="flex items-center justify-between text-ink-400">
            FedaPay
            <Badge tone={config.fedapay.env === "live" ? "success" : "warning"}>{config.fedapay.env === "live" ? "Live" : "Sandbox"}</Badge>
          </p>
          <p className="truncate text-ink-300">{user.email}</p>
          <div className="flex gap-3">
            <Link href="/" className="inline-flex items-center gap-1 text-ink-400 hover:text-white">
              Site <ExternalLink className="size-3.5" />
            </Link>
            <form action={logoutAction}>
              <button className="inline-flex items-center gap-1 text-ink-400 hover:text-white">
                <LogOut className="size-3.5" /> Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
