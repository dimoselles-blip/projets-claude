import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Package, Pencil, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { SERVICE_STATUS } from "@/lib/constants";
import { formatXof } from "@/lib/currency";
import { setServiceStatusAction } from "@/server/actions/services";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { ServiceCover } from "@/components/services/ServiceCard";

export const metadata: Metadata = { title: "Mes services" };

export default async function MyServicesPage() {
  const user = await requireUser(["FREELANCER"]);
  const services = await prisma.service.findMany({
    where: { freelancerId: user.id },
    include: { packages: { orderBy: { priceXof: "asc" } }, category: { include: { parent: true } }, _count: { select: { orders: { where: { paidAt: { not: null } } } } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Mes services"
        description="Vos offres à prix fixe, achetables directement par les entreprises."
        actions={
          <LinkButton href="/tableau-de-bord/services/nouveau">
            <PlusCircle className="size-4" /> Nouveau service
          </LinkButton>
        }
      />
      {services.length === 0 ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title="Vous n'avez pas encore de service"
          description="Créez une offre claire (ex. « Montage YouTube dynamique ») avec jusqu'à 3 niveaux de prix."
          action={<LinkButton href="/tableau-de-bord/services/nouveau">Créer mon premier service</LinkButton>}
        />
      ) : (
        <ul className="space-y-3">
          {services.map((s) => (
            <li key={s.id} className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:flex-row sm:items-center">
              <div className="aspect-video w-full overflow-hidden rounded-xl sm:w-40">
                <ServiceCover service={s} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={s.status} map={SERVICE_STATUS} />
                  <span className="text-xs text-ink-500">{s.category.name}</span>
                </div>
                <p className="mt-1.5 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-ink-500">
                  {s.packages.length} offre(s) · dès {s.packages[0] ? formatXof(s.packages[0].priceXof) : "—"} · {s._count.orders} vente(s)
                </p>
                {s.status === "REJECTED" && s.rejectionReason && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Motif du refus : {s.rejectionReason}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={`/services/${s.slug}`} variant="ghost" size="sm">
                  <Eye className="size-4" /> Aperçu
                </LinkButton>
                <LinkButton href={`/tableau-de-bord/services/${s.id}`} variant="outline" size="sm">
                  <Pencil className="size-4" /> Modifier
                </LinkButton>
                {(s.status === "PUBLISHED" || s.status === "PAUSED") && (
                  <form action={setServiceStatusAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="op" value={s.status === "PUBLISHED" ? "pause" : "resume"} />
                    <SubmitButton variant="ghost" size="sm">
                      {s.status === "PUBLISHED" ? "Mettre en pause" : "Remettre en ligne"}
                    </SubmitButton>
                  </form>
                )}
                <form action={setServiceStatusAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="op" value="delete" />
                  <SubmitButton variant="ghost" size="sm" className="text-red-600" confirm="Supprimer ce service ?">
                    Supprimer
                  </SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-ink-500">
        Besoin d&apos;inspiration ? <Link href="/services" className="font-medium text-brand-700">Parcourez le catalogue</Link>.
      </p>
    </>
  );
}
