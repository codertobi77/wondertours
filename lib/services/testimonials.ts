import { prisma, Prisma } from "@/lib/db";
import type { Testimonial } from "@/lib/db";

export interface TestimonialListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  active?: boolean;
  featured?: boolean;
  circuitId?: string;
}

export async function listTestimonials(
  filters: TestimonialListFilters = {}
): Promise<{ items: Testimonial[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.TestimonialWhereInput = {
    ...(filters.active !== undefined && { isActive: filters.active }),
    ...(filters.featured !== undefined && { isFeatured: filters.featured }),
    ...(filters.circuitId && { circuitId: filters.circuitId }),
    ...(filters.q && {
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { text: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { date: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** Témoignage par id (dashboard — page d'édition). */
export async function getTestimonialById(
  id: string
): Promise<Testimonial | null> {
  return prisma.testimonial.findUnique({ where: { id } });
}

export type TestimonialCreateInput = Prisma.TestimonialUncheckedCreateInput;
export type TestimonialUpdateInput = Prisma.TestimonialUncheckedUpdateInput;

export async function createTestimonial(
  data: TestimonialCreateInput
): Promise<Testimonial> {
  return prisma.testimonial.create({ data });
}

export async function updateTestimonial(
  id: string,
  data: TestimonialUpdateInput
): Promise<Testimonial> {
  return prisma.testimonial.update({ where: { id }, data });
}

export async function deleteTestimonial(id: string): Promise<Testimonial> {
  return prisma.testimonial.delete({ where: { id } });
}
