import { prisma, Prisma, type Booking } from "@/lib/db";

export type BookingStatus = Booking["status"];

export type BookingWithCircuit = Prisma.BookingGetPayload<{
  include: { circuit: { select: { id: true; title: true; slug: true } } };
}>;

export interface BookingListFilters {
  page?: number;
  pageSize?: number;
  status?: BookingStatus;
  circuitId?: string;
  q?: string;
}

export async function listBookings(
  filters: BookingListFilters = {}
): Promise<{
  items: BookingWithCircuit[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.BookingWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...(filters.circuitId && { circuitId: filters.circuitId }),
    ...(filters.q && {
      OR: [
        {
          customerName: { contains: filters.q, mode: "insensitive" },
        },
        { customerEmail: { contains: filters.q, mode: "insensitive" } },
        { bookingReference: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: { circuit: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getBookingById(id: string): Promise<Booking | null> {
  return prisma.booking.findUnique({ where: { id } });
}

/** Réservation avec le circuit associé (titre/slug) — emails de statut. */
export async function getBookingWithCircuitById(
  id: string
): Promise<BookingWithCircuit | null> {
  return prisma.booking.findUnique({
    where: { id },
    include: { circuit: { select: { id: true, title: true, slug: true } } },
  });
}

/** Génère une référence unique lisible : WT-XXXXXX (base 36, 6 caractères). */
async function generateBookingReference(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = `WT-${crypto
      .getRandomValues(new Uint32Array(1))[0]
      .toString(36)
      .toUpperCase()
      .slice(0, 6)
      .padStart(6, "0")}`;
    const existing = await prisma.booking.findUnique({
      where: { bookingReference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
  throw new Error("Impossible de générer une référence de réservation unique");
}

export interface CreateBookingInput {
  type?: Booking["type"];
  circuitId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  travelDate?: Date | null;
  returnDate?: Date | null;
  participants?: number | null;
  totalPrice?: number | null;
  currency?: string;
  notes?: string | null;
}

/**
 * Crée une réservation publique avec référence unique et statut pending.
 * Calcule totalPrice depuis le circuit si non fourni (prix × participants).
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<Booking> {
  let totalPrice = input.totalPrice ?? null;

  if (totalPrice === null && input.circuitId) {
    const circuit = await prisma.circuit.findUnique({
      where: { id: input.circuitId },
      select: { price: true, currency: true },
    });
    if (circuit) {
      const participants = input.participants ?? 1;
      totalPrice = Number(circuit.price) * participants;
    }
  }

  return prisma.booking.create({
    data: {
      bookingReference: await generateBookingReference(),
      type: input.type ?? "circuit",
      circuitId: input.circuitId ?? null,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone ?? null,
      travelDate: input.travelDate ?? null,
      returnDate: input.returnDate ?? null,
      participants: input.participants ?? null,
      totalPrice,
      currency: input.currency ?? "XOF",
      notes: input.notes ?? null,
      status: "pending",
    },
  });
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking> {
  return prisma.booking.update({ where: { id }, data: { status } });
}
