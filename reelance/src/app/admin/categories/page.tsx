import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteCategoryAction, saveCategoryAction } from "@/server/actions/admin";
import { ActionForm, FormField, FormStatus } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/ui/submit-button";
import { Checkbox, Input, Select } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/CategoryIcon";
import type { Category } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const roots = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { services: true, missions: true } },
      children: { orderBy: [{ position: "asc" }, { name: "asc" }], include: { _count: { select: { services: true, missions: true } } } },
    },
  });

  return (
    <>
      <PageHeader title="Catégories" description="Organisez le catalogue en catégories et sous-catégories. Les changements sont immédiats sur le site." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {roots.map((root) => (
            <Card key={root.id}>
              <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <CategoryIcon name={root.icon} className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">
                    {root.name} {!root.isActive && <Badge>Inactive</Badge>}
                  </p>
                  <p className="text-xs text-ink-500">
                    /{root.slug} · {root._count.services} service(s) · {root._count.missions} mission(s)
                  </p>
                </div>
              </div>
              <div className="space-y-2 px-5 py-4">
                <CategoryEditor category={root} roots={roots} />
                {root.children.map((child) => (
                  <div key={child.id} className="rounded-xl border border-ink-100 px-4 py-3">
                    <p className="text-sm font-medium">
                      ↳ {child.name} {!child.isActive && <Badge>Inactive</Badge>}
                      <span className="ml-2 text-xs font-normal text-ink-500">
                        {child._count.services} service(s) · {child._count.missions} mission(s)
                      </span>
                    </p>
                    <CategoryEditor category={child} roots={roots} />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="self-start xl:sticky xl:top-10">
          <CardHeader title="Nouvelle catégorie" description="Laissez « Parent » vide pour créer une catégorie principale." />
          <CardBody>
            <CategoryFields roots={roots} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function CategoryEditor({ category, roots }: { category: Category; roots: Category[] }) {
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs font-medium text-brand-700">Modifier</summary>
      <div className="mt-3 rounded-xl bg-ink-50 p-4">
        <CategoryFields category={category} roots={roots} />
        <form action={deleteCategoryAction} className="mt-3">
          <input type="hidden" name="id" value={category.id} />
          <SubmitButton variant="ghost" size="sm" className="text-red-600" confirm={`Supprimer « ${category.name} » ?`}>
            Supprimer
          </SubmitButton>
        </form>
      </div>
    </details>
  );
}

function CategoryFields({ category, roots }: { category?: Category; roots: Category[] }) {
  const prefix = category?.id ?? "new";
  return (
    <ActionForm action={saveCategoryAction} resetOnSuccess={!category} className="grid gap-3 sm:grid-cols-2">
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormField name="name" label="Nom">
        <Input id={`${prefix}-name`} name="name" defaultValue={category?.name} />
      </FormField>
      <FormField name="slug" label="Slug (URL)">
        <Input id={`${prefix}-slug`} name="slug" defaultValue={category?.slug} placeholder="auto" />
      </FormField>
      <FormField name="parentId" label="Parent">
        <Select id={`${prefix}-parent`} name="parentId" defaultValue={category?.parentId ?? ""}>
          <option value="">— Catégorie principale —</option>
          {roots
            .filter((r) => r.id !== category?.id)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </Select>
      </FormField>
      <FormField name="icon" label="Icône">
        <Select id={`${prefix}-icon`} name="icon" defaultValue={category?.icon ?? ""}>
          <option value="">Par défaut</option>
          {Object.keys(CATEGORY_ICONS).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField name="description" label="Description" className="sm:col-span-2">
        <Input id={`${prefix}-desc`} name="description" defaultValue={category?.description ?? ""} />
      </FormField>
      <FormField name="position" label="Ordre d'affichage">
        <Input id={`${prefix}-pos`} name="position" type="number" min={0} defaultValue={category?.position ?? 0} />
      </FormField>
      <div className="flex items-end pb-2">
        <Checkbox name="isActive" defaultChecked={category?.isActive ?? true} label="Active" />
      </div>
      <FormStatus className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton size="sm">{category ? "Enregistrer" : "Créer la catégorie"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
