import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Lectures partagées par les pages publiques. */

export const getCategoryTree = cache(async () => {
  return prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { children: { where: { isActive: true }, orderBy: [{ position: "asc" }, { name: "asc" }] } },
  });
});

export const serviceCardInclude = {
  category: { include: { parent: true } },
  packages: { orderBy: { priceXof: "asc" } },
  freelancer: { select: { id: true, name: true, freelancerProfile: { select: { slug: true, avatarUrl: true, isVerified: true, city: true, country: true } } } },
  _count: { select: { orders: { where: { status: "COMPLETED" } } } },
} satisfies Prisma.ServiceInclude;

export type ServiceCardData = Prisma.ServiceGetPayload<{ include: typeof serviceCardInclude }>;

export type ServiceFilters = {
  q?: string;
  categorie?: string;
  min?: number;
  max?: number;
  delai?: number;
  tri?: "recent" | "prix-asc" | "prix-desc" | "populaire";
  page?: number;
};

export const PAGE_SIZE = 24;

export async function searchServices(filters: ServiceFilters) {
  const and: Prisma.ServiceWhereInput[] = [{ status: "PUBLISHED" }, { freelancer: { status: "ACTIVE" } }];

  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { tags: { has: filters.q.toLowerCase() } },
      ],
    });
  }
  if (filters.categorie) {
    and.push({ OR: [{ category: { slug: filters.categorie } }, { category: { parent: { slug: filters.categorie } } }] });
  }
  if (filters.min || filters.max) {
    and.push({ packages: { some: { tier: "BASIC", priceXof: { gte: filters.min ?? 0, lte: filters.max ?? 1_000_000_000 } } } });
  }
  if (filters.delai) {
    and.push({ packages: { some: { deliveryDays: { lte: filters.delai } } } });
  }

  const orderBy: Prisma.ServiceOrderByWithRelationInput[] =
    filters.tri === "populaire" ? [{ orders: { _count: "desc" } }, { publishedAt: "desc" }] : [{ publishedAt: "desc" }];

  const where = { AND: and };
  const page = Math.max(1, filters.page ?? 1);
  const [items, total] = await Promise.all([
    prisma.service.findMany({ where, include: serviceCardInclude, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.service.count({ where }),
  ]);

  if (filters.tri === "prix-asc" || filters.tri === "prix-desc") {
    const dir = filters.tri === "prix-asc" ? 1 : -1;
    items.sort((a, b) => dir * ((a.packages[0]?.priceXof ?? 0) - (b.packages[0]?.priceXof ?? 0)));
  }
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFeaturedServices(take = 8) {
  return prisma.service.findMany({
    where: { status: "PUBLISHED", freelancer: { status: "ACTIVE" } },
    include: serviceCardInclude,
    orderBy: [{ orders: { _count: "desc" } }, { publishedAt: "desc" }],
    take,
  });
}

export const freelancerCardSelect = {
  id: true,
  name: true,
  freelancerProfile: { include: { portfolio: { orderBy: { position: "asc" }, take: 1 } } },
  services: { where: { status: "PUBLISHED" }, select: { packages: { select: { priceXof: true } }, category: { select: { name: true } } } },
  _count: { select: { freelancerOrders: { where: { status: "COMPLETED" } } } },
} satisfies Prisma.UserSelect;

export type FreelancerCardData = Prisma.UserGetPayload<{ select: typeof freelancerCardSelect }>;

export async function searchFreelancers(filters: { q?: string; categorie?: string; dispo?: boolean; page?: number }) {
  const and: Prisma.UserWhereInput[] = [
    { role: "FREELANCER", status: "ACTIVE" },
    { freelancerProfile: { headline: { not: "" } } },
  ];
  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { freelancerProfile: { headline: { contains: filters.q, mode: "insensitive" } } },
        { freelancerProfile: { bio: { contains: filters.q, mode: "insensitive" } } },
        { freelancerProfile: { skills: { has: filters.q } } },
      ],
    });
  }
  if (filters.categorie) {
    and.push({
      services: {
        some: {
          status: "PUBLISHED",
          OR: [{ category: { slug: filters.categorie } }, { category: { parent: { slug: filters.categorie } } }],
        },
      },
    });
  }
  if (filters.dispo) and.push({ freelancerProfile: { isAvailable: true } });

  const where = { AND: and };
  const page = Math.max(1, filters.page ?? 1);
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: freelancerCardSelect,
      orderBy: [{ freelancerProfile: { isVerified: "desc" } }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function listOpenMissions(filters: { q?: string; categorie?: string; page?: number }) {
  const and: Prisma.MissionWhereInput[] = [{ status: "OPEN" }];
  if (filters.q) {
    and.push({ OR: [{ title: { contains: filters.q, mode: "insensitive" } }, { description: { contains: filters.q, mode: "insensitive" } }] });
  }
  if (filters.categorie) {
    and.push({ OR: [{ category: { slug: filters.categorie } }, { category: { parent: { slug: filters.categorie } } }] });
  }
  const where = { AND: and };
  const page = Math.max(1, filters.page ?? 1);
  const [items, total] = await Promise.all([
    prisma.mission.findMany({
      where,
      include: {
        category: true,
        client: { select: { name: true, clientProfile: { select: { companyName: true, city: true, country: true, logoUrl: true } } } },
        _count: { select: { applications: { where: { status: { not: "WITHDRAWN" } } } } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.mission.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export type MissionCardData = Awaited<ReturnType<typeof listOpenMissions>>["items"][number];
