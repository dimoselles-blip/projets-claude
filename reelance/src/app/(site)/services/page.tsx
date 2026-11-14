import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/ui/misc";
import { getCategoryTree, searchServices, type ServiceFilters } from "@/lib/queries";
import { getCurrencyContext } from "@/lib/display-currency";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Services de montage vidéo" };

type SP = Promise<Record<string, string | undefined>>;

export default async function ServicesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { currency, rates } = await getCurrencyContext();
  // Les bornes de prix sont saisies dans la devise du visiteur puis converties en FCFA.
  const toXof = (v?: string) => (v && Number(v) > 0 ? Math.round(Number(v) * rates[currency]) : undefined);

  const filters: ServiceFilters = {
    q: sp.q?.trim() || undefined,
    categorie: sp.categorie || undefined,
    min: toXof(sp.min),
    max: toXof(sp.max),
    delai: sp.delai ? Number(sp.delai) : undefined,
    tri: (sp.tri as ServiceFilters["tri"]) || "recent",
    page: sp.page ? Number(sp.page) : 1,
  };
  const [categories, result] = await Promise.all([getCategoryTree(), searchServices(filters)]);
  const active = categories.flatMap((c) => [c, ...c.children]).find((c) => c.slug === filters.categorie);
  const parent = categories.find((c) => c.id === active?.id || c.id === active?.parentId);

  const link = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: undefined, ...patch })) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/services?${qs}` : "/services";
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold sm:text-4xl">{active ? active.name : filters.q ? `Résultats pour « ${filters.q} »` : "Tous les services"}</h1>
        <p className="mt-2 text-ink-500">
          {result.total} service{result.total > 1 ? "s" : ""} de montage vidéo · prix affichés en {currency}
        </p>
      </div>

      {/* Catégories : défilement horizontal sur mobile */}
      <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip href={link({ categorie: undefined })} active={!filters.categorie}>
          Tout
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} href={link({ categorie: c.slug })} active={parent?.id === c.id}>
            {c.name}
          </Chip>
        ))}
      </div>
      {parent && parent.children.length > 0 && (
        <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {parent.children.map((c) => (
            <Chip key={c.id} small href={link({ categorie: c.slug })} active={active?.id === c.id}>
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      <form className="mb-8 grid grid-cols-2 gap-2 rounded-2xl border border-ink-100 bg-ink-50/60 p-3 sm:flex sm:flex-wrap sm:items-end">
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {filters.categorie && <input type="hidden" name="categorie" value={filters.categorie} />}
        <label className="text-xs font-medium text-ink-600">
          Budget min ({currency})
          <input name="min" type="number" min={0} defaultValue={sp.min} className="mt-1 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm sm:w-32" />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Budget max ({currency})
          <input name="max" type="number" min={0} defaultValue={sp.max} className="mt-1 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm sm:w-32" />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Délai de livraison
          <select name="delai" defaultValue={sp.delai ?? ""} className="mt-1 h-10 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm sm:w-40">
            <option value="">Tous délais</option>
            <option value="1">24 h</option>
            <option value="3">Jusqu&apos;à 3 jours</option>
            <option value="7">Jusqu&apos;à 7 jours</option>
            <option value="14">Jusqu&apos;à 14 jours</option>
          </select>
        </label>
        <label className="text-xs font-medium text-ink-600">
          Trier par
          <select name="tri" defaultValue={filters.tri} className="mt-1 h-10 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm sm:w-44">
            <option value="recent">Plus récents</option>
            <option value="populaire">Plus commandés</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
          </select>
        </label>
        <button type="submit" className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800 sm:col-span-1">
          <SlidersHorizontal className="size-4" /> Filtrer
        </button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="Aucun service ne correspond à votre recherche"
          description="Élargissez vos filtres, ou publiez une mission : les monteurs vous enverront leurs devis."
          action={
            <Link href="/tableau-de-bord/missions/nouvelle" className="link-brand">
              Publier une mission →
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.items.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
      <Pagination page={result.page} pages={result.pages} basePath="/services" params={{ ...sp, page: undefined }} />
    </div>
  );
}

function Chip({ href, active, small, children }: { href: string; active: boolean; small?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border font-medium whitespace-nowrap transition",
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        active ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-ink-400",
      )}
    >
      {children}
    </Link>
  );
}
