import { prisma, Prisma } from "@/lib/db";
import type { Destination } from "@/lib/db";

export interface DestinationListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  active?: boolean;
}

export async function listDestinations(
  filters: DestinationListFilters = {}
): Promise<{ items: Destination[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.DestinationWhereInput = {
    ...(filters.active !== undefined && { isActive: filters.active }),
    ...(filters.q && {
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { country: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.destination.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.destination.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getDestinationBySlug(
  slug: string
): Promise<Destination | null> {
  return prisma.destination.findFirst({ where: { slug, isActive: true } });
}

/** Destination par id (dashboard — page d'édition). */
export async function getDestinationById(id: string): Promise<Destination | null> {
  return prisma.destination.findUnique({ where: { id } });
}

export type DestinationCreateInput = Prisma.DestinationUncheckedCreateInput;
export type DestinationUpdateInput = Prisma.DestinationUncheckedUpdateInput;

export async function createDestination(
  data: DestinationCreateInput
): Promise<Destination> {
  return prisma.destination.create({ data });
}

export async function updateDestination(
  id: string,
  data: DestinationUpdateInput
): Promise<Destination> {
  return prisma.destination.update({ where: { id }, data });
}

export async function deleteDestination(id: string): Promise<Destination> {
  return prisma.destination.delete({ where: { id } });
}
