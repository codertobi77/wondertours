import { notFound } from "next/navigation";
import { getBlogPostById, listBlogCategories } from "@/lib/services/blog";
import { toStringArray } from "@/lib/view-models";
import { BlogPostForm } from "@/components/dashboard/forms/blog-post-form";

export const dynamic = "force-dynamic";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'un article existant : préremplit le formulaire partagé. */
export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) notFound();

  const categories = await listBlogCategories({ pageSize: 100 });

  return (
    <BlogPostForm
      categories={categories.items.map((c) => ({ value: c.id, label: c.name }))}
      initial={{
        id: post.id,
        title: post.title,
        titleEn: post.titleEn,
        excerpt: post.excerpt,
        excerptEn: post.excerptEn,
        content: post.content,
        contentEn: post.contentEn,
        categoryId: post.categoryId,
        imageUrl: post.imageUrl,
        tags: toStringArray(post.tags),
        readTime: post.readTime,
        isFeatured: post.isFeatured,
      }}
    />
  );
}
