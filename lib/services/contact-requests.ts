import { prisma, Prisma, type ContactRequest } from "@/lib/db";

export type ContactRequestStatus = ContactRequest["status"];

export interface ContactRequestListFilters {
  page?: number;
  pageSize?: number;
  status?: ContactRequestStatus;
  requestType?: ContactRequest["requestType"];
  q?: string;
}

export async function listContactRequests(
  filters: ContactRequestListFilters = {}
): Promise<{
  items: ContactRequest[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.ContactRequestWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...(filters.requestType && { requestType: filters.requestType }),
    ...(filters.q && {
      OR: [
        { name: { contains: filters.q } },
        { email: { contains: filters.q } },
        { subject: { contains: filters.q } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contactRequest.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getContactRequestById(
  id: string
): Promise<ContactRequest | null> {
  return prisma.contactRequest.findUnique({ where: { id } });
}

export type CreateContactRequestInput = Prisma.ContactRequestUncheckedCreateInput;

/** Crée une demande de contact publique (statut initial : new). */
export async function createContactRequest(
  data: CreateContactRequestInput
): Promise<ContactRequest> {
  return prisma.contactRequest.create({ data: { ...data, status: "new" } });
}

export async function updateContactRequestStatus(
  id: string,
  status: ContactRequestStatus
): Promise<ContactRequest> {
  return prisma.contactRequest.update({ where: { id }, data: { status } });
}

export async function deleteContactRequest(id: string): Promise<ContactRequest> {
  return prisma.contactRequest.delete({ where: { id } });
}
