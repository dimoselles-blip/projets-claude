import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { SERVICE_STATUS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { formatDate, cn } from "@/lib/utils";
import { moderateServiceAction } from "@/server/actions/admin";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { ServiceCover } from "@/components/services/ServiceCard";
import type { ServiceStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Services" };

const TABS: { key: ServiceStatus; label: string }[] = [
  { key: "PENDING_REVIEW", label: "À valider" },
  { key: "PUBLISHED", label: "Publiés" },
  { key: "PAUSED", label: "En pause" },
  { key: "REJECTED", label: "Refusés" },
  { key: "DRAFT", label: "Brouillons" },
];

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin();
  const { statut } = await searchParams;
  const status = TABS.find((t) => t.key === statut)?.key ?? "PENDING_REVIEW";
  const services = await prisma.service.findMany({
    where: { status },
    include: { packages: { orderBy: { priceXof: "asc" } }, category: { include: { parent: true } }, freelancer: { select: { name: true, email: true } } },
    orderBy: { updatedAt: status === "PENDING_REVIEW" ? "asc" : "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Services" description="Validez les services avant leur publication dans le catalogue." />
      <div className="scrollbar-none mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/services?statut=${t.key}`} className={cn("shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium", t.key === status ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100")}>
            {t.label}
          </Link>
        ))}
      </div>
      {services.length === 0 ? (
        <EmptyState title="Rien à afficher" description={status === "PENDING_REVIEW" ? "Aucun service en attente de validation." : undefined} />
      ) : (
        <ul className="space-y-4">
          {services.map((s) => (
            <li key={s.id} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:w-48">
                  <ServiceCover service={s} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={s.status} map={SERVICE_STATUS} />
                    <span className="text-xs text-ink-500">
                      {s.category.parent ? `${s.category.parent.name} · ` : ""}
                      {s.category.name} · mis à jour le {formatDate(s.updatedAt, true)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-semibold">{s.title}</p>
                  <p className="text-sm text-ink-500">
                    {s.freelancer.name} · {s.freelancer.email}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-700">{s.description}</p>
                  <p className="mt-2 text-xs text-ink-500">{s.packages.map((p) => `${p.name} : ${formatXof(p.priceXof)} / ${p.deliveryDays} j`).join(" · ")}</p>
                  <Link href={`/services/${s.slug}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-sm link-brand">
                    Aperçu complet <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>
              <form action={moderateServiceAction} className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:items-center">
                <input type="hidden" name="id" value={s.id} />
                <input name="reason" placeholder="Motif (obligatoire pour un refus, visible par le freelance)" className="h-9 flex-1 rounded-lg border border-ink-200 px-3 text-sm" defaultValue={s.rejectionReason ?? ""} />
                <div className="flex gap-2">
                  {s.status !== "PUBLISHED" && (
                    <SubmitButton name="decision" value="approve" variant="success" size="sm">
                      Publier
                    </SubmitButton>
                  )}
                  {s.status !== "REJECTED" && (
                    <SubmitButton name="decision" value="reject" variant="outline" size="sm">
                      Refuser
                    </SubmitButton>
                  )}
                  {s.status === "PUBLISHED" && (
                    <SubmitButton name="decision" value="pause" variant="outline" size="sm" confirm="Retirer ce service du catalogue ?">
                      Suspendre
                    </SubmitButton>
                  )}
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
