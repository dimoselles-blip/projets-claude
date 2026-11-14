import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { getCategoryTree } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/misc";
import { ServiceForm } from "@/components/services/ServiceForm";

export const metadata: Metadata = { title: "Nouveau service" };

export default async function NewServicePage() {
  await requireUser(["FREELANCER"]);
  const [categories, settings] = await Promise.all([getCategoryTree(), getSettings()]);
  return (
    <>
      <PageHeader title="Nouveau service" description="Décrivez votre offre et fixez vos prix une seule fois, en FCFA." />
      <ServiceForm categories={categories} requireReview={settings.requireServiceReview} />
    </>
  );
}
