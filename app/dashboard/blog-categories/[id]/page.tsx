import { notFound } from "next/navigation";
import { getBlogCategoryById } from "@/lib/services/blog";
import { BlogCategoryForm } from "@/components/dashboard/forms/blog-category-form";

export const dynamic = "force-dynamic";

interface EditBlogCategoryPageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'une catégorie de blog existante : préremplit le formulaire partagé. */
export default async function EditBlogCategoryPage({
  params,
}: EditBlogCategoryPageProps) {
  const { id } = await params;
  const category = await getBlogCategoryById(id);
  if (!category) notFound();

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
