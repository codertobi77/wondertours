"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { toStringArray } from "@/lib/view-models";
import { BlogPostForm } from "@/components/dashboard/forms/blog-post-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type { ApiBlogCategory, ApiBlogPost, ApiPage } from "@/lib/api-types";

/** Édition d'un article existant : préremplit le formulaire partagé. */
export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: post,
    error: postError,
    loading: postLoading,
    status: postStatus,
  } = useApiData<ApiBlogPost>(`/api/dashboard/blog/${id}`);
  const {
    data: categories,
    error: categoriesError,
    loading: categoriesLoading,
  } = useApiData<ApiPage<ApiBlogCategory>>(
    "/api/dashboard/blog-categories?pageSize=100"
  );

  if (postLoading || categoriesLoading) return <LoadingBlock />;
  if (postError) {
    if (postStatus === 404) return <MissingBlock label="Article" />;
    return <ErrorBlock message={postError} />;
  }
  if (categoriesError) return <ErrorBlock message={categoriesError} />;
  if (!post || !categories) return <LoadingBlock />;

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
