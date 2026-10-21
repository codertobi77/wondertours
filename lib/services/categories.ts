import { prisma, Prisma } from "@/lib/db";
import type { Category } from "@/lib/db";

export interface CategoryListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  active?: boolean;
}

export async function listCategories(
  filters: CategoryListFilters = {}
): Promise<{ items: Category[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.CategoryWhereInput = {
    ...(filters.active !== undefined && { isActive: filters.active }),
    ...(filters.q && {
      name: { contains: filters.q, mode: "insensitive" },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** Catégorie par id (dashboard — page d'édition). */
export async function getCategoryById(id: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { id } });
}

export type CategoryCreateInput = Prisma.CategoryUncheckedCreateInput;
export type CategoryUpdateInput = Prisma.CategoryUncheckedUpdateInput;

export async function createCategory(
  data: CategoryCreateInput
): Promise<Category> {
  return prisma.category.create({ data });
}

export async function updateCategory(
  id: string,
  data: CategoryUpdateInput
): Promise<Category> {
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string): Promise<Category> {
  return prisma.category.delete({ where: { id } });
}
