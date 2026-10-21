import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/services/categories";
import { CategoryForm } from "@/components/dashboard/forms/category-form";

export const dynamic = "force-dynamic";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'une catégorie existante : préremplit le formulaire partagé. */
export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();

  return (
    <CategoryForm
      initial={{
        id: category.id,
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        descriptionEn: category.descriptionEn,
        icon: category.icon,
        color: category.color,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      }}
    />
  );
}
