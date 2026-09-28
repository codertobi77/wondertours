import { z } from "zod";
import {
  ok,
  notFound,
  parseBody,
  handleProtectedRoute,
  uuidSchema,
  prismaErrorResponse,
} from "@/lib/api/utils";
import {
  updateBookingStatus,
  getBookingById,
  getBookingWithCircuitById,
} from "@/lib/services/bookings";
import { sendEmailSafe } from "@/lib/services/mailer";
import { bookingStatusEmail } from "@/lib/services/mail-templates";

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/dashboard/bookings/[id]/status'>
) {
  return handleProtectedRoute(request, async (_session) => {
    const { id } = await ctx.params;
    if (!uuidSchema.safeParse(id).success) return notFound("Réservation introuvable");

    const [body, errorResponse] = await parseBody(request, statusSchema);
    if (errorResponse) return errorResponse;

    const existing = await getBookingById(id);
    if (!existing) return notFound("Réservation introuvable");

    try {
      const booking = await updateBookingStatus(id, body.status);

      // Notification client best effort si le statut change réellement
      // (sendEmailSafe — jamais bloquant pour la requête).
      if (existing.status !== body.status) {
        const withCircuit = await getBookingWithCircuitById(id);
        await sendEmailSafe({
          to: booking.customerEmail,
          ...bookingStatusEmail({
            name: booking.customerName,
            bookingReference: booking.bookingReference,
            circuitTitle: withCircuit?.circuit?.title ?? null,
            status: booking.status,
          }),
        });
      }

      return ok(booking);
    } catch (error) {
      const prismaResponse = prismaErrorResponse(error);
      if (prismaResponse) return prismaResponse;
      throw error;
    }
  }, { roles: ["admin", "editor"] });
}
