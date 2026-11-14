import { SiteHeader } from "@/components/layout/SiteHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Avatar } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["FREELANCER", "CLIENT"]);
  const role = user.role as "FREELANCER" | "CLIENT";
  return (
    <>
      <SiteHeader />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-5 hidden items-center gap-3 lg:flex">
            <Avatar name={user.name} src={user.freelancerProfile?.avatarUrl ?? user.clientProfile?.logoUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-ink-500">{role === "FREELANCER" ? "Compte freelance" : user.clientProfile?.companyName ?? "Compte entreprise"}</p>
            </div>
          </div>
          <DashboardNav role={role} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
