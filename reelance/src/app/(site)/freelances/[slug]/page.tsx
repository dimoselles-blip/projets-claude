import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Briefcase, CalendarDays, CircleCheck, Languages, MapPin, MonitorCog, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { COUNTRIES } from "@/lib/constants";
import { serviceCardInclude } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Price } from "@/components/Price";
import { ServiceCard } from "@/components/services/ServiceCard";
import { VideoEmbed } from "@/components/VideoEmbed";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  return prisma.freelancerProfile.findUnique({
    where: { slug },
    include: {
      portfolio: { orderBy: { position: "asc" } },
      user: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          services: { where: { status: "PUBLISHED" }, include: serviceCardInclude, orderBy: { publishedAt: "desc" } },
          _count: { select: { freelancerOrders: { where: { status: "COMPLETED" } } } },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await load((await params).slug);
  return p ? { title: `${p.user.name} — ${p.headline}`, description: p.bio.slice(0, 160) } : {};
}

export default async function FreelancerProfilePage({ params }: { params: Params }) {
  const profile = await load((await params).slug);
  if (!profile || profile.user.status !== "ACTIVE") notFound();
  const { user } = profile;
  const location = [profile.city, COUNTRIES[profile.country] ?? profile.country].filter(Boolean).join(", ");

  return (
    <div>
      <div className="relative h-36 overflow-hidden bg-ink-950 sm:h-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.svg" alt="" aria-hidden className="absolute top-6 right-5 h-12 sm:top-1/2 sm:right-10 sm:h-20 sm:-translate-y-1/2" />
      </div>
      <div className="container-page relative">
        <div className="-mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
          {/* Colonne profil */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <Avatar name={user.name} src={profile.avatarUrl} size={96} className="ring-4 ring-white" />
              <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
                {user.name}
                {profile.isVerified && <BadgeCheck className="size-5 fill-brand-400 text-ink-950" aria-label="Profil vérifié par Reelance" />}
              </h1>
              <p className="mt-1 text-ink-600">{profile.headline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.isAvailable ? <Badge tone="success">Disponible pour de nouveaux projets</Badge> : <Badge>Indisponible actuellement</Badge>}
                {profile.isVerified && <Badge tone="brand">Vérifié</Badge>}
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <Info icon={<MapPin className="size-4" />} label="Localisation" value={location} />
                {profile.dayRateXof ? <Info icon={<Wallet className="size-4" />} label="Tarif journalier" value={<Price xof={profile.dayRateXof} />} /> : null}
                {profile.yearsExperience ? <Info icon={<Briefcase className="size-4" />} label="Expérience" value={`${profile.yearsExperience} an(s)`} /> : null}
                <Info icon={<CircleCheck className="size-4" />} label="Commandes terminées" value={String(user._count.freelancerOrders)} />
                {profile.languages.length > 0 && <Info icon={<Languages className="size-4" />} label="Langues" value={profile.languages.join(", ")} />}
                <Info icon={<CalendarDays className="size-4" />} label="Membre depuis" value={formatDate(user.createdAt)} />
              </dl>
              {user.services.length > 0 && (
                <LinkButton href="#services" className="mt-6 w-full">
                  Voir ses services
                </LinkButton>
              )}
            </div>

            {profile.software.length > 0 && (
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <MonitorCog className="size-4 text-ink-950" /> Logiciels
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.software.map((s) => (
                    <span key={s} className="rounded-md bg-ink-50 px-2.5 py-1 text-sm text-ink-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Contenu */}
          <div className="min-w-0 pt-2 lg:pt-20">
            <section>
              <h2 className="text-xl font-bold">Présentation</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-700">{profile.bio || "Ce monteur n'a pas encore rédigé sa présentation."}</p>
              {profile.skills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <Badge key={s} tone="brand" className="px-3 py-1 text-sm font-medium">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {profile.portfolio.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold">Portfolio</h2>
                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {profile.portfolio.map((item) => (
                    <figure key={item.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
                      <VideoEmbed url={item.videoUrl} title={item.title} />
                      <figcaption className="p-4">
                        <p className="font-semibold">{item.title}</p>
                        {item.description && <p className="mt-1 text-sm text-ink-600">{item.description}</p>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <section id="services" className="mt-12 scroll-mt-24">
              <h2 className="text-xl font-bold">Services proposés</h2>
              {user.services.length === 0 ? (
                <p className="mt-3 text-ink-500">Aucun service publié pour le moment. Vous pouvez publier une mission : ce monteur pourra y postuler.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {user.services.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-ink-500">
        {icon} {label}
      </dt>
      <dd className="text-right font-medium text-ink-900">{value}</dd>
    </div>
  );
}
