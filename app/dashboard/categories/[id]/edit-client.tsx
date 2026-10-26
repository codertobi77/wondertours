"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { CategoryForm } from "@/components/dashboard/forms/category-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type { ApiCategory } from "@/lib/api-types";

/** Édition d'une catégorie existante : préremplit le formulaire partagé. */
export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: category,
    error,
    loading,
    status,
  } = useApiData<ApiCategory>(`/api/dashboard/categories/${id}`);

  if (loading) return <LoadingBlock />;
  if (error) {
    if (status === 404) return <MissingBlock label="Catégorie" />;
    return <ErrorBlock message={error} />;
  }
  if (!category) return <LoadingBlock />;

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
