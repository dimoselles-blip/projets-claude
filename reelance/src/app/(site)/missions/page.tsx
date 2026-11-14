import type { Metadata } from "next";
import { Inbox, Search } from "lucide-react";
import { MissionCard } from "@/components/missions/MissionCard";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { getCategoryTree, listOpenMissions } from "@/lib/queries";

export const metadata: Metadata = { title: "Missions de montage vidéo" };

export default async function MissionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [categories, result] = await Promise.all([
    getCategoryTree(),
    listOpenMissions({ q: sp.q?.trim() || undefined, categorie: sp.categorie, page: sp.page ? Number(sp.page) : 1 }),
  ]);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Missions ouvertes</h1>
          <p className="mt-2 text-ink-500">Des entreprises cherchent un monteur : envoyez votre devis.</p>
        </div>
        <LinkButton href="/tableau-de-bord/missions/nouvelle" variant="outline">
          Publier une mission
        </LinkButton>
      </div>

      <form className="mt-6 mb-8 grid gap-2 rounded-2xl border border-ink-100 bg-ink-50/60 p-3 sm:grid-cols-[1fr_240px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input name="q" defaultValue={sp.q} type="search" placeholder="Mot-clé…" className="h-11 w-full rounded-lg border border-ink-200 bg-white pr-3 pl-9 text-sm" />
        </div>
        <select name="categorie" defaultValue={sp.categorie ?? ""} className="h-11 rounded-lg border border-ink-200 bg-white px-3 text-sm" aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-lg bg-ink-900 px-5 text-sm font-semibold text-white hover:bg-ink-800">Rechercher</button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" />} title="Aucune mission ouverte pour le moment" description="Revenez bientôt, ou publiez vos services pour être trouvé directement par les entreprises." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.items.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>
      )}
      <Pagination page={result.page} pages={result.pages} basePath="/missions" params={{ ...sp, page: undefined }} />
    </div>
  );
}
