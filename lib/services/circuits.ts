import { prisma, Prisma, type Circuit } from "@/lib/db";

// Types exposés
export type CircuitWithRelations = Prisma.CircuitGetPayload<{
  include: { destination: true; categories: true };
}>;

export interface CircuitListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  destinationSlug?: string;
  categorySlug?: string;
  featured?: boolean;
  active?: boolean;
  maxPrice?: number;
  maxDuration?: number;
}

/**
 * Liste paginée de circuits avec relations destination + catégorie.
 * `active` est neutre par défaut (toutes lignes) ; les routes publiques
 * passent active: true, le dashboard voit tout.
 */
export async function listCircuits(filters: CircuitListFilters = {}): Promise<{
  items: CircuitWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.CircuitWhereInput = {
    ...(filters.active !== undefined && { isActive: filters.active }),
    ...(filters.featured !== undefined && { isFeatured: filters.featured }),
    ...(filters.destinationSlug && {
      destination: { slug: filters.destinationSlug },
    }),
    ...(filters.categorySlug && {
      categories: { some: { slug: filters.categorySlug } },
    }),
    ...(filters.q && {
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
    ...(filters.maxPrice !== undefined && {
      price: { lte: filters.maxPrice },
    }),
    ...(filters.maxDuration !== undefined && {
      durationDays: { lte: filters.maxDuration },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.circuit.findMany({
      where,
      include: { destination: true, categories: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.circuit.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** Circuit public par slug (actif uniquement). */
export async function getCircuitBySlug(
  slug: string,
  includeInactive = false
): Promise<CircuitWithRelations | null> {
  return prisma.circuit.findFirst({
    where: { slug, ...(includeInactive ? {} : { isActive: true }) },
    include: { destination: true, categories: true },
  });
}

/** Circuit par id (dashboard). */
export async function getCircuitById(
  id: string
): Promise<CircuitWithRelations | null> {
  return prisma.circuit.findUnique({
    where: { id },
    include: { destination: true, categories: true },
  });
}

export type CircuitCreateInput = Prisma.CircuitUncheckedCreateInput;
export type CircuitUpdateInput = Prisma.CircuitUncheckedUpdateInput;

export async function createCircuit(
  data: CircuitCreateInput
): Promise<Circuit> {
  return prisma.circuit.create({ data });
}

export async function updateCircuit(
  id: string,
  data: CircuitUpdateInput
): Promise<Circuit> {
  return prisma.circuit.update({ where: { id }, data });
}

export async function deleteCircuit(id: string): Promise<Circuit> {
  return prisma.circuit.delete({ where: { id } });
}
