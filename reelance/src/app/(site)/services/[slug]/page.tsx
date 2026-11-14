import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrencyContext } from "@/lib/display-currency";
import { formatXof } from "@/lib/currency";
import { PACKAGE_TIERS, COUNTRIES } from "@/lib/constants";
import { serviceCardInclude } from "@/lib/queries";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ServiceCard, ServiceCover } from "@/components/services/ServiceCard";
import { PackageSelector, type PackageView } from "@/components/services/PackageSelector";
import { VideoEmbed } from "@/components/VideoEmbed";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  return prisma.service.findUnique({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      packages: true,
      freelancer: { include: { freelancerProfile: true, _count: { select: { freelancerOrders: { where: { status: "COMPLETED" } } } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const service = await load((await params).slug);
  return service ? { title: service.title, description: service.description.slice(0, 160) } : {};
}

export default async function ServicePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [service, user, money] = await Promise.all([load(slug), getCurrentUser(), getCurrencyContext()]);
  if (!service) notFound();

  const isOwner = user?.id === service.freelancerId;
  const isAdmin = user?.role === "ADMIN";
  if (service.status !== "PUBLISHED" && !isOwner && !isAdmin) notFound();

  const profile = service.freelancer.freelancerProfile;
  const packages: PackageView[] = PACKAGE_TIERS.flatMap(({ tier, label }) => {
    const p = service.packages.find((pk) => pk.tier === tier);
    if (!p) return [];
    return [
      {
        tier,
        label,
        name: p.name,
        description: p.description,
        price: money.format(p.priceXof),
        priceBase: money.currency === "XOF" || money.currency === "XAF" ? null : formatXof(p.priceXof),
        deliveryDays: p.deliveryDays,
        revisions: p.revisions,
        features: p.features,
      },
    ];
  });

  const others = await prisma.service.findMany({
    where: { freelancerId: service.freelancerId, status: "PUBLISHED", NOT: { id: service.id } },
    include: serviceCardInclude,
    take: 3,
  });

  const canOrder = service.status === "PUBLISHED" && (!user || user.role === "CLIENT");
  const reason = isOwner
    ? "C'est votre service : aperçu tel que les clients le voient."
    : user?.role === "FREELANCER"
      ? "Connectez-vous avec un compte entreprise pour commander."
      : service.status !== "PUBLISHED"
        ? "Ce service n'est pas encore publié."
        : "Commande réservée aux comptes client.";

  return (
    <div className="container-page py-6 sm:py-10">
      {service.status !== "PUBLISHED" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aperçu : ce service n&apos;est pas visible publiquement (statut : {service.status}).
        </div>
      )}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-500" aria-label="Fil d'Ariane">
        <Link href="/services" className="hover:text-ink-900">
          Services
        </Link>
        {service.category.parent && (
          <>
            <ChevronRight className="size-4" />
            <Link href={`/services?categorie=${service.category.parent.slug}`} className="hover:text-ink-900">
              {service.category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-4" />
        <Link href={`/services?categorie=${service.category.slug}`} className="hover:text-ink-900">
          {service.category.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-bold sm:text-3xl">{service.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <Avatar name={service.freelancer.name} src={profile?.avatarUrl} size={44} />
            <div>
              <Link href={`/freelances/${profile?.slug}`} className="flex items-center gap-1.5 font-semibold decoration-brand-400 decoration-[3px] underline-offset-4 hover:underline">
                {service.freelancer.name}
                {profile?.isVerified && <BadgeCheck className="size-4 fill-brand-400 text-ink-950" />}
              </Link>
              <p className="text-sm text-ink-500">{profile?.headline}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl">
            {service.videoUrl ? <VideoEmbed url={service.videoUrl} title={service.title} /> : <div className="aspect-video"><ServiceCover service={service} /></div>}
          </div>

          {/* Offres : affichées ici sur mobile, dans la colonne de droite sur ordinateur */}
          <div className="mt-6 lg:hidden">
            <PackageSelector packages={packages} orderHref={`/commander/${service.slug}`} canOrder={canOrder} reason={reason} />
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-bold">À propos de ce service</h2>
            <div className="mt-4 space-y-4 leading-relaxed whitespace-pre-line text-ink-700">{service.description}</div>
            {service.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {service.tags.map((t) => (
                  <Badge key={t}>#{t}</Badge>
                ))}
              </div>
            )}
          </section>

          {packages.length > 1 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">Comparer les offres</h2>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-100">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-ink-50 text-left">
                    <tr>
                      <th className="p-4 font-medium text-ink-500" />
                      {packages.map((p) => (
                        <th key={p.tier} className="p-4">
                          <span className="block text-xs text-ink-500 uppercase">{p.label}</span>
                          <span className="font-display text-lg font-bold">{p.price}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-ink-100">
                      <td className="p-4 text-ink-500">Délai</td>
                      {packages.map((p) => (
                        <td key={p.tier} className="p-4 font-medium">
                          {p.deliveryDays} j
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-ink-100">
                      <td className="p-4 text-ink-500">Retouches</td>
                      {packages.map((p) => (
                        <td key={p.tier} className="p-4 font-medium">
                          {p.revisions}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-ink-100 align-top">
                      <td className="p-4 text-ink-500">Inclus</td>
                      {packages.map((p) => (
                        <td key={p.tier} className="p-4 text-ink-700">
                          <ul className="space-y-1">
                            {p.features.map((f) => (
                              <li key={f}>✓ {f}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {profile && (
            <section className="mt-10 rounded-2xl border border-ink-100 p-5 sm:p-6">
              <h2 className="text-xl font-bold">Le monteur</h2>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar name={service.freelancer.name} src={profile.avatarUrl} size={64} />
                <div className="flex-1">
                  <p className="font-semibold">{service.freelancer.name}</p>
                  <p className="text-sm text-ink-600">{profile.headline}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                    <MapPin className="size-3.5" /> {[profile.city, COUNTRIES[profile.country]].filter(Boolean).join(", ")} ·{" "}
                    {service.freelancer._count.freelancerOrders} commande(s) terminée(s)
                  </p>
                </div>
                <LinkButton href={`/freelances/${profile.slug}`} variant="outline">
                  Voir le profil
                </LinkButton>
              </div>
              <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-ink-700">{profile.bio}</p>
            </section>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <PackageSelector packages={packages} orderHref={`/commander/${service.slug}`} canOrder={canOrder} reason={reason} />
            <div className="flex items-start gap-3 rounded-2xl bg-ink-50 p-4 text-sm text-ink-600">
              <ShieldCheck className="size-5 shrink-0 text-ink-950" />
              <p>
                Reelance garde votre paiement en séquestre. Le monteur n&apos;est payé qu&apos;après validation de la livraison. Un problème ? Ouvrez un litige, l&apos;équipe tranche.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold">Autres services de {service.freelancer.name}</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
