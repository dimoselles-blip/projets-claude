import type { Metadata } from "next";
import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import { FreelancerCard } from "@/components/freelancers/FreelancerCard";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/ui/misc";
import { getCategoryTree, searchFreelancers } from "@/lib/queries";

export const metadata: Metadata = { title: "Monteurs vidéo freelances" };

export default async function FreelancersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [categories, result] = await Promise.all([
    getCategoryTree(),
    searchFreelancers({ q: sp.q?.trim() || undefined, categorie: sp.categorie, dispo: sp.dispo === "1", page: sp.page ? Number(sp.page) : 1 }),
  ]);

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Monteurs vidéo freelances</h1>
      <p className="mt-2 text-ink-500">Parcourez les profils, les portfolios et les tarifs des monteurs Reelance.</p>

      <form className="mt-6 mb-8 grid gap-2 rounded-2xl border border-ink-100 bg-ink-50/60 p-3 sm:grid-cols-[1fr_220px_auto_auto] sm:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input name="q" defaultValue={sp.q} type="search" placeholder="Compétence, logiciel, nom…" className="h-11 w-full rounded-lg border border-ink-200 bg-white pr-3 pl-9 text-sm" />
        </div>
        <select name="categorie" defaultValue={sp.categorie ?? ""} className="h-11 rounded-lg border border-ink-200 bg-white px-3 text-sm" aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-2 text-sm text-ink-700">
          <input type="checkbox" name="dispo" value="1" defaultChecked={sp.dispo === "1"} className="size-4 accent-brand-600" /> Disponibles
        </label>
        <button className="h-11 rounded-lg bg-ink-900 px-5 text-sm font-semibold text-white hover:bg-ink-800">Rechercher</button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="size-5" />}
          title="Aucun monteur trouvé"
          description="Essayez d'autres mots-clés ou publiez une mission pour recevoir des candidatures."
          action={
            <Link href="/tableau-de-bord/missions/nouvelle" className="font-semibold text-brand-700">
              Publier une mission →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((f) => (
            <FreelancerCard key={f.id} freelancer={f} />
          ))}
        </div>
      )}
      <Pagination page={result.page} pages={result.pages} basePath="/freelances" params={{ ...sp, page: undefined }} />
    </div>
  );
}
