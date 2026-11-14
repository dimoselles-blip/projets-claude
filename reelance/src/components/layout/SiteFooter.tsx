import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { getCategoryTree } from "@/lib/queries";

export async function SiteFooter() {
  const categories = await getCategoryTree();
  return (
    <footer className="mt-24 bg-ink-950 text-ink-300">
      <div className="container-page grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo variant="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
            La marketplace qui connecte les entreprises aux meilleurs monteurs vidéo freelances d&apos;Afrique francophone.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300">
            <ShieldCheck className="size-4 text-emerald-400" /> Paiements sécurisés par FedaPay · Mobile Money &amp; carte
          </p>
        </div>
        <FooterCol title="Catégories" links={categories.slice(0, 6).map((c) => ({ href: `/services?categorie=${c.slug}`, label: c.name }))} />
        <FooterCol
          title="Entreprises"
          links={[
            { href: "/services", label: "Trouver un service" },
            { href: "/freelances", label: "Parcourir les monteurs" },
            { href: "/tableau-de-bord/missions/nouvelle", label: "Publier une mission" },
            { href: "/#comment-ca-marche", label: "Paiement sécurisé" },
          ]}
        />
        <FooterCol
          title="Monteurs"
          links={[
            { href: "/inscription?role=FREELANCER", label: "Devenir freelance" },
            { href: "/missions", label: "Missions ouvertes" },
            { href: "/tableau-de-bord/services/nouveau", label: "Publier un service" },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Reelance. Tous droits réservés.</p>
          <p>Fait au Bénin 🇧🇯 pour toute l&apos;Afrique francophone.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink-400 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
