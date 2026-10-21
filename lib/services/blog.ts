import { prisma, Prisma } from "@/lib/db";
import type { BlogPost, BlogCategory } from "@/lib/db";

// ─────────────────────────────── Articles ───────────────────────────────

export type BlogPostWithRelations = Prisma.BlogPostGetPayload<{
  include: { category: true; author: true };
}>;

export interface BlogPostListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  categorySlug?: string;
  featured?: boolean;
  published?: boolean;
}

export async function listBlogPosts(
  filters: BlogPostListFilters = {}
): Promise<{
  items: BlogPostWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.BlogPostWhereInput = {
    ...(filters.published !== undefined && { isPublished: filters.published }),
    ...(filters.featured !== undefined && { isFeatured: filters.featured }),
    ...(filters.categorySlug && { category: { slug: filters.categorySlug } }),
    ...(filters.q && {
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { excerpt: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      include: { category: true, author: true },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getBlogPostBySlug(
  slug: string,
  includeUnpublished = false
): Promise<BlogPostWithRelations | null> {
  return prisma.blogPost.findFirst({
    where: { slug, ...(includeUnpublished ? {} : { isPublished: true }) },
    include: { category: true, author: true },
  });
}

export async function getBlogPostById(
  id: string
): Promise<BlogPostWithRelations | null> {
  return prisma.blogPost.findUnique({
    where: { id },
    include: { category: true, author: true },
  });
}

export async function incrementBlogPostViews(id: string): Promise<void> {
  await prisma.blogPost.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

export type BlogPostCreateInput = Prisma.BlogPostUncheckedCreateInput;
export type BlogPostUpdateInput = Prisma.BlogPostUncheckedUpdateInput;

export async function createBlogPost(
  data: BlogPostCreateInput
): Promise<BlogPost> {
  return prisma.blogPost.create({ data });
}

export async function updateBlogPost(
  id: string,
  data: BlogPostUpdateInput
): Promise<BlogPost> {
  return prisma.blogPost.update({ where: { id }, data });
}

export async function deleteBlogPost(id: string): Promise<BlogPost> {
  return prisma.blogPost.delete({ where: { id } });
}

// ─────────────────────────── Catégories blog ───────────────────────────

export interface BlogCategoryListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  active?: boolean;
}

export async function listBlogCategories(
  filters: BlogCategoryListFilters = {}
): Promise<{
  items: BlogCategory[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.BlogCategoryWhereInput = {
    ...(filters.active !== undefined && { isActive: filters.active }),
    ...(filters.q && {
      name: { contains: filters.q, mode: "insensitive" },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.blogCategory.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blogCategory.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** Catégorie de blog par id (dashboard — page d'édition). */
export async function getBlogCategoryById(
  id: string
): Promise<BlogCategory | null> {
  return prisma.blogCategory.findUnique({ where: { id } });
}

export type BlogCategoryCreateInput = Prisma.BlogCategoryUncheckedCreateInput;
export type BlogCategoryUpdateInput = Prisma.BlogCategoryUncheckedUpdateInput;

export async function createBlogCategory(
  data: BlogCategoryCreateInput
): Promise<BlogCategory> {
  return prisma.blogCategory.create({ data });
}

export async function updateBlogCategory(
  id: string,
  data: BlogCategoryUpdateInput
): Promise<BlogCategory> {
  return prisma.blogCategory.update({ where: { id }, data });
}

export async function deleteBlogCategory(id: string): Promise<BlogCategory> {
  return prisma.blogCategory.delete({ where: { id } });
}
