/**
 * Données initiales Reelance.
 *   npm run db:seed                  → catégories + compte administrateur
 *   SEED_DEMO=true npm run db:seed   → + freelances, services, client et mission de démonstration
 *
 * Le script est idempotent : il peut être relancé sans créer de doublons.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;
if (!connectionString) throw new Error("DATABASE_URL n'est pas défini.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const CATEGORIES = [
  {
    name: "Montage YouTube",
    slug: "montage-youtube",
    icon: "youtube",
    description: "Vlogs, tutoriels, podcasts vidéo, chaînes de créateurs.",
    children: [
      { name: "Montage simple", slug: "youtube-montage-simple" },
      { name: "Montage dynamique (B-roll, transitions, sound design)", slug: "youtube-montage-dynamique" },
    ],
  },
  {
    name: "Vidéos Corporate",
    slug: "videos-corporate",
    icon: "corporate",
    description: "Communication interne et externe des entreprises.",
    children: [
      { name: "Interview", slug: "corporate-interview" },
      { name: "Vidéo corporate (script, tournage, motion design)", slug: "corporate-video-complete" },
    ],
  },
  {
    name: "Pub et Réseaux sociaux",
    slug: "pub-reseaux-sociaux",
    icon: "social",
    description: "Formats courts verticaux pour Reels, TikTok, Shorts et publicités.",
    children: [
      { name: "Vidéo pub courte (Reels / TikTok)", slug: "social-pub-courte" },
      { name: "Pack de vidéos mensuel", slug: "social-pack-mensuel" },
    ],
  },
  {
    name: "Mariage et Événements",
    slug: "mariage-evenements",
    icon: "wedding",
    description: "Mariages, cérémonies, conférences, festivals.",
    children: [
      { name: "Highlight", slug: "evenement-highlight" },
      { name: "Pack complet jour J", slug: "evenement-pack-jour-j" },
    ],
  },
  {
    name: "Clips musicaux",
    slug: "clips-musicaux",
    icon: "music",
    description: "Clips d'artistes, lyric videos, performances live.",
    children: [
      { name: "Lyric video", slug: "clip-lyric-video" },
      { name: "Clip performance avec étalonnage", slug: "clip-performance-etalonnage" },
    ],
  },
  {
    name: "Motion Design",
    slug: "motion-design",
    icon: "motion",
    description: "Animation 2D, logos animés, vidéos explicatives.",
    children: [
      { name: "Logo animé", slug: "motion-logo-anime" },
      { name: "Vidéo explicative animée", slug: "motion-video-explicative" },
    ],
  },
];

async function seedCategories() {
  for (const [i, cat] of CATEGORIES.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, position: i },
      update: {},
    });
    for (const [j, child] of cat.children.entries()) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        create: { name: child.name, slug: child.slug, parentId: parent.id, position: j },
        update: {},
      });
    }
  }
  console.log(`✔ ${CATEGORIES.length} catégories et leurs sous-catégories`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@reelance.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✔ Compte admin déjà présent : ${email}`);
    return;
  }
  if (!password || password.length < 10) {
    throw new Error("Définissez ADMIN_PASSWORD (10 caractères minimum) dans .env pour créer le compte administrateur.");
  }
  await prisma.user.create({
    data: { email, name: process.env.ADMIN_NAME ?? "Admin Reelance", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`✔ Compte admin créé : ${email}`);
}

// ───────────────────────── Démo ─────────────────────────

const DEMO_PASSWORD = "Demo-Reelance-2026";

type DemoService = {
  category: string;
  title: string;
  description: string;
  tags: string[];
  packages: { tier: "BASIC" | "STANDARD" | "PREMIUM"; name: string; description: string; priceXof: number; deliveryDays: number; revisions: number; features: string[] }[];
};

const DEMO_FREELANCERS: {
  name: string;
  email: string;
  city: string;
  headline: string;
  bio: string;
  skills: string[];
  software: string[];
  years: number;
  dayRate: number;
  verified: boolean;
  services: DemoService[];
}[] = [
  {
    name: "Koffi Adjovi",
    email: "koffi.demo@reelance.local",
    city: "Cotonou",
    headline: "Monteur YouTube & créateurs de contenu — 6 ans d'expérience",
    bio: "Je monte des vidéos YouTube rythmées pour des créateurs et des marques d'Afrique de l'Ouest : vlogs, tutoriels, podcasts vidéo.\n\nMon approche : un premier montage sous 72 h, des retours intégrés rapidement, et une attention particulière au rythme et au son.",
    skills: ["Montage dynamique", "Sound design", "Sous-titrage", "Miniatures"],
    software: ["Premiere Pro", "After Effects", "Audition"],
    years: 6,
    dayRate: 45000,
    verified: true,
    services: [
      {
        category: "youtube-montage-dynamique",
        title: "Je monte votre vidéo YouTube avec B-roll, transitions et sound design",
        description:
          "Un montage professionnel qui retient l'attention de vos abonnés du début à la fin.\n\nInclus : dérushage, coupes rythmées, B-roll, transitions, habillage texte, mixage audio et sound design, export optimisé pour YouTube.\n\nEnvoyez-moi vos rushs (Drive ou WeTransfer), votre script si vous en avez un et 1 ou 2 vidéos de référence.",
        tags: ["youtube", "vlog", "b-roll", "sound design"],
        packages: [
          { tier: "BASIC", name: "Vidéo courte", description: "Jusqu'à 8 min de vidéo finale.", priceXof: 25000, deliveryDays: 3, revisions: 1, features: ["Jusqu'à 8 min", "Coupes et rythme", "Musique libre de droits"] },
          { tier: "STANDARD", name: "Vidéo complète", description: "Jusqu'à 15 min avec B-roll et sous-titres.", priceXof: 45000, deliveryDays: 4, revisions: 2, features: ["Jusqu'à 15 min", "B-roll et transitions", "Sous-titres", "Sound design"] },
          { tier: "PREMIUM", name: "Pack créateur", description: "Vidéo longue + 3 Shorts extraits.", priceXof: 75000, deliveryDays: 6, revisions: 3, features: ["Jusqu'à 25 min", "3 Shorts verticaux", "Miniature YouTube", "Étalonnage"] },
        ],
      },
      {
        category: "youtube-montage-simple",
        title: "Montage simple et propre de vos vidéos YouTube ou podcasts",
        description:
          "Idéal pour les podcasts filmés, cours en ligne et interviews : je nettoie, coupe les temps morts, harmonise le son et ajoute intro, outro et titres.\n\nLivraison en 1080p ou 4K, prête à publier.",
        tags: ["podcast", "youtube", "formation"],
        packages: [
          { tier: "BASIC", name: "Essentiel", description: "Jusqu'à 30 min de rushs.", priceXof: 15000, deliveryDays: 2, revisions: 1, features: ["Nettoyage et coupes", "Intro / outro", "Export 1080p"] },
          { tier: "STANDARD", name: "Confort", description: "Jusqu'à 90 min de rushs, multi-caméra.", priceXof: 30000, deliveryDays: 3, revisions: 2, features: ["Multi-caméra", "Titres et lower thirds", "Mixage audio"] },
        ],
      },
    ],
  },
  {
    name: "Aïcha Diallo",
    email: "aicha.demo@reelance.local",
    city: "Abidjan",
    headline: "Motion designer — logos animés et vidéos explicatives",
    bio: "Motion designer depuis 5 ans, j'anime des identités de marque et je crée des vidéos explicatives pour des startups, banques et ONG.\n\nDe l'écriture du script à l'animation finale, je vous accompagne pour rendre vos messages clairs et mémorables.",
    skills: ["Motion design 2D", "Animation de logo", "Storyboard", "Illustration"],
    software: ["After Effects", "Illustrator", "Cinema 4D"],
    years: 5,
    dayRate: 60000,
    verified: true,
    services: [
      {
        category: "motion-logo-anime",
        title: "J'anime votre logo pour vos vidéos et réseaux sociaux",
        description:
          "Un logo animé élégant pour introduire vos vidéos, vos publicités et vos présentations.\n\nFournissez votre logo en vectoriel (AI, SVG, PDF) et votre charte : je vous propose une animation sur mesure avec son design.",
        tags: ["logo", "intro", "branding", "motion"],
        packages: [
          { tier: "BASIC", name: "Logo simple", description: "Animation 5 s, fond uni.", priceXof: 20000, deliveryDays: 2, revisions: 2, features: ["5 secondes", "1080p", "Fond uni"] },
          { tier: "STANDARD", name: "Logo + son", description: "Animation 8 s avec sound design.", priceXof: 40000, deliveryDays: 3, revisions: 3, features: ["8 secondes", "Sound design", "Version fond transparent"] },
          { tier: "PREMIUM", name: "Pack identité", description: "Intro, outro et version verticale.", priceXof: 70000, deliveryDays: 5, revisions: 4, features: ["Intro + outro", "Format 9:16", "Fichiers sources AE"] },
        ],
      },
      {
        category: "motion-video-explicative",
        title: "Vidéo explicative animée pour présenter votre produit ou service",
        description:
          "Une vidéo de 60 à 90 secondes pour expliquer simplement votre offre : script, storyboard, illustrations, animation, voix off et musique.\n\nParfaite pour votre site, vos campagnes et vos présentations investisseurs.",
        tags: ["explainer", "startup", "animation 2d"],
        packages: [
          { tier: "BASIC", name: "30 secondes", description: "Animation sur votre script.", priceXof: 120000, deliveryDays: 7, revisions: 2, features: ["30 s", "Illustrations sur mesure", "Musique"] },
          { tier: "STANDARD", name: "60 secondes", description: "Script, storyboard et voix off.", priceXof: 220000, deliveryDays: 12, revisions: 3, features: ["60 s", "Script et storyboard", "Voix off FR"] },
        ],
      },
    ],
  },
  {
    name: "Rodrigue Houngbédji",
    email: "rodrigue.demo@reelance.local",
    city: "Porto-Novo",
    headline: "Vidéaste événementiel — mariages et conférences",
    bio: "Je filme et monte vos mariages, dots et événements d'entreprise au Bénin et au Togo, avec une équipe de 2 à 3 cadreurs.\n\nJe livre un film émotion, des teasers pour les réseaux sociaux et l'intégralité des moments clés.",
    skills: ["Tournage", "Étalonnage", "Drone", "Montage émotion"],
    software: ["DaVinci Resolve", "Final Cut Pro"],
    years: 8,
    dayRate: 80000,
    verified: false,
    services: [
      {
        category: "evenement-highlight",
        title: "Film highlight de votre mariage ou événement (3 à 5 minutes)",
        description:
          "Un film court et émouvant qui raconte votre journée, à partir de vos rushs ou de notre tournage.\n\nÉtalonnage cinéma, musique choisie avec vous, version teaser pour Instagram et WhatsApp.",
        tags: ["mariage", "dot", "highlight", "événement"],
        packages: [
          { tier: "BASIC", name: "Highlight", description: "3 min à partir de vos rushs.", priceXof: 60000, deliveryDays: 7, revisions: 1, features: ["3 min", "Étalonnage", "Musique"] },
          { tier: "STANDARD", name: "Highlight + teaser", description: "5 min + teaser vertical.", priceXof: 95000, deliveryDays: 10, revisions: 2, features: ["5 min", "Teaser 9:16", "Étalonnage cinéma"] },
        ],
      },
      {
        category: "social-pub-courte",
        title: "Vidéo pub courte pour Reels, TikTok et Shorts",
        description:
          "Une publicité verticale de 15 à 30 secondes, pensée pour arrêter le scroll : accroche dans les 2 premières secondes, sous-titres animés, call-to-action.\n\nÀ partir de vos rushs ou de visuels produits.",
        tags: ["reels", "tiktok", "publicité", "vertical"],
        packages: [
          { tier: "BASIC", name: "1 vidéo", description: "15 à 30 s.", priceXof: 18000, deliveryDays: 2, revisions: 1, features: ["Format 9:16", "Sous-titres animés", "Musique tendance"] },
          { tier: "STANDARD", name: "Pack 4 vidéos", description: "4 déclinaisons pour vos campagnes.", priceXof: 60000, deliveryDays: 5, revisions: 2, features: ["4 vidéos", "Accroches A/B", "Formats 9:16 et 1:1"] },
        ],
      },
    ],
  },
];

async function upsertUser(data: { email: string; name: string; role: "FREELANCER" | "CLIENT"; country: string }) {
  return prisma.user.upsert({
    where: { email: data.email },
    create: { ...data, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10) },
    update: {},
  });
}

async function seedDemo() {
  const categories = await prisma.category.findMany();
  const catId = (slug: string) => categories.find((c) => c.slug === slug)!.id;

  for (const f of DEMO_FREELANCERS) {
    const user = await upsertUser({ email: f.email, name: f.name, role: "FREELANCER", country: f.email.includes("aicha") ? "CI" : "BJ" });
    const slug = f.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    await prisma.freelancerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        slug,
        headline: f.headline,
        bio: f.bio,
        city: f.city,
        country: user.country,
        skills: f.skills,
        software: f.software,
        languages: ["Français", "Anglais"],
        yearsExperience: f.years,
        dayRateXof: f.dayRate,
        isVerified: f.verified,
        payoutOperator: user.country === "CI" ? "MTN_CI" : "MTN_BJ",
        payoutPhone: user.country === "CI" ? "0700000000" : "0197000000",
      },
      update: {},
    });
    for (const s of f.services) {
      const sslug = `${s.title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}-demo`;
      const exists = await prisma.service.findUnique({ where: { slug: sslug } });
      if (exists) continue;
      await prisma.service.create({
        data: {
          slug: sslug,
          freelancerId: user.id,
          categoryId: catId(s.category),
          title: s.title,
          description: s.description,
          tags: s.tags,
          status: "PUBLISHED",
          publishedAt: new Date(),
          packages: { create: s.packages },
        },
      });
    }
  }

  const client = await upsertUser({ email: "client.demo@reelance.local", name: "Mireille Agossou", role: "CLIENT", country: "BJ" });
  await prisma.clientProfile.upsert({
    where: { userId: client.id },
    create: { userId: client.id, companyName: "Saveurs du Bénin SARL", sector: "Agroalimentaire", companySize: "11 à 50", city: "Cotonou", country: "BJ" },
    update: {},
  });
  const euClient = await upsertUser({ email: "client.paris@reelance.local", name: "Julien Martin", role: "CLIENT", country: "FR" });
  await prisma.user.update({ where: { id: euClient.id }, data: { currency: "EUR" } });
  await prisma.clientProfile.upsert({
    where: { userId: euClient.id },
    create: { userId: euClient.id, companyName: "Studio Lumière Paris", sector: "Agence de communication", city: "Paris", country: "FR" },
    update: {},
  });

  const missionTitle = "Montage de 4 vidéos Reels par mois pour une marque de jus naturels";
  if (!(await prisma.mission.findFirst({ where: { title: missionTitle } }))) {
    const mission = await prisma.mission.create({
      data: {
        clientId: client.id,
        categoryId: catId("social-pack-mensuel"),
        title: missionTitle,
        description:
          "Nous lançons notre gamme de jus naturels à Cotonou et cherchons un monteur pour 4 Reels par mois (15 à 30 s).\n\nNous fournissons les rushs (tournés au téléphone) et la charte graphique. Ton jeune, dynamique, sous-titres obligatoires. Collaboration sur 3 mois minimum.",
        budgetMinXof: 50000,
        budgetMaxXof: 90000,
        skills: ["Reels", "Sous-titres animés", "CapCut"],
        status: "OPEN",
        publishedAt: new Date(),
      },
    });
    const koffi = await prisma.user.findUniqueOrThrow({ where: { email: "koffi.demo@reelance.local" } });
    await prisma.application.create({
      data: {
        missionId: mission.id,
        freelancerId: koffi.id,
        coverLetter: "Bonjour ! Je monte déjà des Reels pour deux marques locales. Je vous propose un premier Reel test sous 48 h, puis un rythme d'un Reel par semaine, avec sous-titres animés à vos couleurs.",
        priceXof: 70000,
        deliveryDays: 7,
      },
    });
  }
  console.log(`✔ Données de démo (mot de passe des comptes démo : ${DEMO_PASSWORD})`);
}

async function main() {
  await seedCategories();
  await seedAdmin();
  if (process.env.SEED_DEMO === "true") await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
