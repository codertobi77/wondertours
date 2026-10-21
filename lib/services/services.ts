import { prisma, Prisma } from "@/lib/db";
import type { Service } from "@/lib/db";

export interface ServiceListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  active?: boolean;
}

export async function listServices(
  filters: ServiceListFilters = {}
): Promise<{ items: Service[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.ServiceWhereInput = {
    ...(filters.active !== undefined && { isActive: filters.active }),
    ...(filters.q && {
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.service.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** Service par id (dashboard — page d'édition). */
export async function getServiceById(id: string): Promise<Service | null> {
  return prisma.service.findUnique({ where: { id } });
}

export type ServiceCreateInput = Prisma.ServiceUncheckedCreateInput;
export type ServiceUpdateInput = Prisma.ServiceUncheckedUpdateInput;

export async function createService(data: ServiceCreateInput): Promise<Service> {
  return prisma.service.create({ data });
}

export async function updateService(
  id: string,
  data: ServiceUpdateInput
): Promise<Service> {
  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: string): Promise<Service> {
  return prisma.service.delete({ where: { id } });
}
