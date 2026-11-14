import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CircleCheck,
  FileText,
  Handshake,
  Lock,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ServiceCard } from "@/components/services/ServiceCard";
import { getCategoryTree, getFeaturedServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const POPULAR = ["Montage YouTube", "Reels TikTok", "Vidéo corporate", "Clip musical", "Logo animé", "Mariage"];

export default async function HomePage() {
  const [categories, services, settings] = await Promise.all([getCategoryTree(), getFeaturedServices(8), getSettings()]);

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(55%_75%_at_88%_0%,rgb(242_233_36/0.16),transparent_60%)]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="container-page relative py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-ink-200">
              <span className="size-1.5 rounded-full bg-brand-400" /> La marketplace vidéo d&apos;Afrique francophone
            </p>
            <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-6xl">
              Des monteurs vidéo talentueux,{" "}
              <span className="text-brand-400">prêts pour vos projets.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-300">
              YouTube, corporate, pubs réseaux sociaux, mariages, clips, motion design : achetez un service clé en main ou publiez votre mission. Vous ne payez le freelance qu&apos;une fois la vidéo validée.
            </p>

            <form action="/services" role="search" className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/40 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400" aria-hidden />
                <input
                  name="q"
                  type="search"
                  aria-label="Rechercher un service"
                  placeholder="Quel type de vidéo cherchez-vous ?"
                  className="h-12 w-full rounded-xl pr-4 pl-12 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none"
                />
              </div>
              <button type="submit" className="h-12 rounded-xl bg-brand-400 px-6 font-semibold text-ink-950 hover:bg-brand-300">
                Rechercher
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-400">Populaire :</span>
              {POPULAR.map((p) => (
                <Link key={p} href={`/services?q=${encodeURIComponent(p)}`} className="rounded-full border border-white/15 px-3 py-1 text-ink-200 hover:border-white/40 hover:text-white">
                  {p}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-white/[0.03]">
          <div className="container-page grid grid-cols-2 gap-4 py-5 text-sm text-ink-300 md:grid-cols-4">
            <Trust icon={<Lock className="size-4" />} text="Paiement bloqué jusqu'à validation" />
            <Trust icon={<Smartphone className="size-4" />} text="Mobile Money & carte bancaire" />
            <Trust icon={<BadgeCheck className="size-4" />} text="Services validés par Reelance" />
            <Trust icon={<Banknote className="size-4" />} text="Prix affichés dans votre devise" />
          </div>
        </div>
      </section>

      {/* ───────── Catégories ───────── */}
      <section className="container-page py-16 sm:py-20">
        <SectionTitle eyebrow="Catégories" title="Trouvez le bon format pour votre vidéo" href="/services" cta="Tous les services" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services?categorie=${c.slug}`}
              className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-ink-950 hover:shadow-card-hover sm:p-6"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-brand-100 text-ink-950 transition group-hover:bg-brand-400 sm:size-12">
                <CategoryIcon name={c.icon} className="size-5 sm:size-6" />
              </span>
              <span className="mt-4 font-display text-base font-bold text-ink-900 sm:text-lg">{c.name}</span>
              <span className="mt-1 hidden text-sm text-ink-500 sm:block">{c.children.map((s) => s.name).join(" · ")}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── Services populaires ───────── */}
      {services.length > 0 && (
        <section className="bg-ink-50/70 py-16 sm:py-20">
          <div className="container-page">
            <SectionTitle eyebrow="Services" title="Services populaires" href="/services" cta="Voir le catalogue" />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── Deux façons de travailler ───────── */}
      <section className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Deux façons de travailler</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Achat direct ou appel à candidatures</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Mode
            icon={<ShoppingBag className="size-6" />}
            title="Acheter un service"
            text="Choisissez un service à prix fixe (Essentiel, Standard ou Premium), envoyez vos consignes et payez : le monteur démarre aussitôt."
            points={["Prix et délai connus d'avance", "Aucune négociation", "Idéal pour les formats récurrents"]}
            cta={{ href: "/services", label: "Parcourir les services" }}
          />
          <Mode
            dark
            icon={<FileText className="size-6" />}
            title="Publier une mission"
            text="Décrivez votre projet et votre budget. Les monteurs intéressés vous envoient un message et un devis : vous choisissez."
            points={["Recevez plusieurs devis", "Comparez les profils et portfolios", "Idéal pour les projets sur mesure"]}
            cta={{ href: "/tableau-de-bord/missions/nouvelle", label: "Publier une mission" }}
          />
        </div>
      </section>

      {/* ───────── Paiement sécurisé ───────── */}
      <section id="comment-ca-marche" className="scroll-mt-20 bg-ink-950 py-16 text-white sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow text-ink-300!">Paiement sécurisé</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Votre argent est protégé <span className="text-brand-400">jusqu&apos;à la livraison</span></h2>
            <p className="mt-4 text-ink-300">
              Reelance conserve les fonds en séquestre pendant toute la durée du projet. Le freelance est payé uniquement quand vous validez la livraison.
            </p>
          </div>
          <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Step n={1} icon={<Handshake className="size-5" />} title="Vous commandez" text="Achat d'un service ou choix d'un freelance parmi les candidatures." />
            <Step n={2} icon={<ShieldCheck className="size-5" />} title="Vous payez en sécurité" text="Mobile Money ou carte via FedaPay. Les fonds sont bloqués sur Reelance." />
            <Step n={3} icon={<Sparkles className="size-5" />} title="Le monteur livre" text="Vous recevez la vidéo et pouvez demander des retouches." />
            <Step
              n={4}
              icon={<CircleCheck className="size-5" />}
              title="Vous validez"
              text={`Le freelance est payé. Sans réponse sous ${settings.autoCompleteDays} jours, la livraison est validée automatiquement.`}
            />
          </ol>
        </div>
      </section>

      {/* ───────── CTA freelances ───────── */}
      <section className="container-page pt-16 sm:pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-400 px-6 py-12 text-ink-950 sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -top-24 -right-24 size-80 rounded-full bg-white/35 blur-3xl" />
          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Vous êtes monteur vidéo ?</h2>
              <p className="mt-3 max-w-xl text-ink-800">
                Créez votre profil en quelques minutes, publiez vos services et postulez aux missions des entreprises. Vous êtes payé sur Mobile Money dès que le client valide.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <LinkButton href="/inscription?role=FREELANCER" variant="dark" size="lg">
                Devenir freelance <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/missions" variant="outline" size="lg" className="border-2 border-ink-950 bg-transparent hover:bg-ink-950/5">
                Voir les missions
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-2">
      <span className="text-brand-400">{icon}</span>
      {text}
    </p>
  );
}

function SectionTitle({ eyebrow, title, href, cta }: { eyebrow: string; title: string; href: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h2>
      </div>
      <Link href={href} className="link-brand inline-flex items-center gap-1 text-sm">
        {cta} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function Mode({
  icon,
  title,
  text,
  points,
  cta,
  dark,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  points: string[];
  cta: { href: string; label: string };
  dark?: boolean;
}) {
  return (
    <div className={`flex flex-col rounded-3xl p-7 sm:p-9 ${dark ? "bg-ink-900 text-white" : "border border-ink-100 bg-white shadow-card"}`}>
      <span className={`grid size-12 place-items-center rounded-2xl bg-brand-400 text-ink-950`}>{icon}</span>
      <h3 className="mt-5 text-2xl font-bold">{title}</h3>
      <p className={`mt-2 leading-relaxed ${dark ? "text-ink-300" : "text-ink-600"}`}>{text}</p>
      <ul className="mt-5 space-y-2 text-sm">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <CircleCheck className={`size-4 ${dark ? "text-brand-400" : "text-ink-950"}`} /> {p}
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <LinkButton href={cta.href} variant={dark ? "primary" : "dark"}>
          {cta.label} <ArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  );
}

function Step({ n, icon, title, text }: { n: number; icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-400 text-ink-950">{icon}</span>
        <span className="font-display text-3xl font-extrabold text-white/10">0{n}</span>
      </div>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{text}</p>
    </li>
  );
}
