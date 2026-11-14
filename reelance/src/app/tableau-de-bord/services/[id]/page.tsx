import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { getCategoryTree } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/misc";
import { ServiceForm } from "@/components/services/ServiceForm";

export const metadata: Metadata = { title: "Modifier le service" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["FREELANCER"]);
  const { id } = await params;
  const service = await prisma.service.findFirst({ where: { id, freelancerId: user.id }, include: { packages: true } });
  if (!service) notFound();
  const [categories, settings] = await Promise.all([getCategoryTree(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Modifier le service"
        description={service.status === "PUBLISHED" && settings.requireServiceReview ? "Après envoi, les modifications seront relues avant d'être remises en ligne." : undefined}
      />
      <ServiceForm
        categories={categories}
        requireReview={settings.requireServiceReview}
        initial={{
          id: service.id,
          title: service.title,
          description: service.description,
          categoryId: service.categoryId,
          coverUrl: service.coverUrl,
          videoUrl: service.videoUrl,
          tags: service.tags,
          status: service.status,
          packages: service.packages.map((p) => ({ ...p })),
        }}
      />
    </>
  );
}
