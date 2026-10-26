"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { BlogCategoryForm } from "@/components/dashboard/forms/blog-category-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type { ApiBlogCategory } from "@/lib/api-types";

/** Édition d'une catégorie de blog existante : préremplit le formulaire partagé. */
export default function EditBlogCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: category,
    error,
    loading,
    status,
  } = useApiData<ApiBlogCategory>(`/api/dashboard/blog-categories/${id}`);

  if (loading) return <LoadingBlock />;
  if (error) {
    if (status === 404) return <MissingBlock label="Catégorie de blog" />;
    return <ErrorBlock message={error} />;
  }
  if (!category) return <LoadingBlock />;

  return (
    <BlogCategoryForm
      initial={{
        id: category.id,
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        descriptionEn: category.descriptionEn,
        color: category.color,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      }}
    />
  );
}
