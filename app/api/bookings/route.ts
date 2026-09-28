import { z } from "zod";
import { created, parseBody, badRequest, handleRoute } from "@/lib/api/utils";
import { createBooking } from "@/lib/services/bookings";
import { getCircuitById } from "@/lib/services/circuits";
import { getTeamEmails, sendEmailSafe } from "@/lib/services/mailer";
import {
  bookingConfirmationEmail,
  bookingNotificationEmail,
} from "@/lib/services/mail-templates";

const bodySchema = z.object({
  circuitId: z.string().uuid().optional(),
  type: z.enum(["circuit", "stay", "hotel"]).default("circuit"),
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional(),
  travelDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  participants: z.coerce.number().int().min(1).max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export async function POST(request: Request) {
  return handleRoute(async () => {
    const [body, errorResponse] = await parseBody(request, bodySchema);
    if (errorResponse) return errorResponse;

    // Si un circuit est fourni, il doit exister et être actif.
    // (le titre servira à l'email de confirmation)
    const circuit = body.circuitId
      ? await getCircuitById(body.circuitId)
      : null;
    if (body.circuitId && (!circuit || !circuit.isActive)) {
      return badRequest("Circuit invalide ou introuvable");
    }

    const booking = await createBooking({
      circuitId: body.circuitId ?? null,
      type: body.type,
      customerName: body.name,
      customerEmail: body.email,
      customerPhone: body.phone || null,
      travelDate: body.travelDate ? new Date(body.travelDate) : null,
      returnDate: body.returnDate ? new Date(body.returnDate) : null,
      participants: body.participants ?? null,
      notes: body.notes || null,
    });

    // Emails best effort (sendEmailSafe) : confirmation au client +
    // notification interne — jamais bloquants pour la requête.
    const emailData = {
      name: booking.customerName,
      bookingReference: booking.bookingReference,
      circuitTitle: circuit?.title ?? null,
      type: booking.type,
      travelDate: booking.travelDate,
      returnDate: booking.returnDate,
      participants: booking.participants,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
    };
    await Promise.all([
      sendEmailSafe({
        to: booking.customerEmail,
        ...bookingConfirmationEmail(emailData),
      }),
      sendEmailSafe({
        to: getTeamEmails(),
        ...bookingNotificationEmail({
          ...emailData,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          notes: booking.notes,
        }),
      }),
    ]);

    return created({
      message: "Réservation enregistrée avec succès",
      id: booking.id,
      bookingReference: booking.bookingReference,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
    });
  });
}
