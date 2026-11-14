import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { COUNTRIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { setUserStatusAction, toggleVerifiedAction } from "@/server/actions/admin";
import { PageHeader, Table, Th, Td, Avatar } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string; statut?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const where: Prisma.UserWhereInput = {
    ...(sp.role === "FREELANCER" || sp.role === "CLIENT" || sp.role === "ADMIN" ? { role: sp.role } : {}),
    ...(sp.statut === "SUSPENDED" ? { status: "SUSPENDED" } : {}),
    ...(sp.q
      ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { clientProfile: { companyName: { contains: sp.q, mode: "insensitive" } } }] }
      : {}),
  };
  const users = await prisma.user.findMany({
    where,
    include: {
      freelancerProfile: { select: { id: true, slug: true, isVerified: true, avatarUrl: true } },
      clientProfile: { select: { companyName: true } },
      _count: { select: { services: true, missions: true, clientOrders: true, freelancerOrders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Utilisateurs" description="Freelances et clients inscrits (inscription autonome)." />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Nom, e-mail, entreprise…" className="h-10 min-w-56 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm" />
        <select name="role" defaultValue={sp.role ?? ""} className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm">
          <option value="">Tous les rôles</option>
          <option value="FREELANCER">Freelances</option>
          <option value="CLIENT">Clients</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select name="statut" defaultValue={sp.statut ?? ""} className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm">
          <option value="">Tous statuts</option>
          <option value="SUSPENDED">Suspendus</option>
        </select>
        <button className="h-10 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white">Filtrer</button>
      </form>
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Utilisateur</Th>
              <Th>Rôle</Th>
              <Th>Activité</Th>
              <Th>Inscrit le</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.freelancerProfile?.avatarUrl} size={34} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 font-medium">
                        {u.freelancerProfile ? (
                          <Link href={`/freelances/${u.freelancerProfile.slug}`} className="decoration-brand-400 decoration-[3px] underline-offset-4 hover:underline">
                            {u.name}
                          </Link>
                        ) : (
                          u.name
                        )}
                        {u.freelancerProfile?.isVerified && <BadgeCheck className="size-4 fill-brand-400 text-ink-950" />}
                      </p>
                      <p className="text-xs text-ink-500">
                        {u.email}
                        {u.clientProfile ? ` · ${u.clientProfile.companyName}` : ""} · {COUNTRIES[u.country] ?? u.country}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-col items-start gap-1">
                    <Badge tone={u.role === "ADMIN" ? "danger" : u.role === "FREELANCER" ? "brand" : "info"}>{u.role === "ADMIN" ? "Admin" : u.role === "FREELANCER" ? "Freelance" : "Client"}</Badge>
                    {u.status === "SUSPENDED" && <Badge tone="danger">Suspendu</Badge>}
                  </div>
                </Td>
                <Td className="text-xs text-ink-600">
                  {u.role === "FREELANCER" ? `${u._count.services} service(s) · ${u._count.freelancerOrders} commande(s)` : u.role === "CLIENT" ? `${u._count.missions} mission(s) · ${u._count.clientOrders} commande(s)` : "—"}
                </Td>
                <Td className="text-xs">{formatDate(u.createdAt)}</Td>
                <Td className="text-right">
                  {u.role !== "ADMIN" && (
                    <div className="flex justify-end gap-1.5">
                      {u.freelancerProfile && (
                        <form action={toggleVerifiedAction}>
                          <input type="hidden" name="profileId" value={u.freelancerProfile.id} />
                          <SubmitButton variant="ghost" size="sm">
                            {u.freelancerProfile.isVerified ? "Retirer badge" : "Vérifier"}
                          </SubmitButton>
                        </form>
                      )}
                      <form action={setUserStatusAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="status" value={u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                        <SubmitButton variant={u.status === "ACTIVE" ? "outline" : "success"} size="sm" confirm={u.status === "ACTIVE" ? `Suspendre ${u.name} ? Ses services seront mis en pause.` : undefined}>
                          {u.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {users.length === 0 && <p className="p-6 text-sm text-ink-500">Aucun utilisateur.</p>}
      </Card>
    </>
  );
}
