"use client";

import { useApiData } from "@/lib/api-client";
import { BlogPostForm } from "@/components/dashboard/forms/blog-post-form";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import type { ApiBlogCategory, ApiPage } from "@/lib/api-types";

export default function NewBlogPostPage() {
  const {
    data: categories,
    error,
    loading,
  } = useApiData<ApiPage<ApiBlogCategory>>(
    "/api/dashboard/blog-categories?pageSize=100"
  );

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!categories) return <LoadingBlock />;

  return (
    <BlogPostForm
      categories={categories.items.map((c) => ({ value: c.id, label: c.name }))}
    />
  );
}
