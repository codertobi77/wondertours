import { z } from "zod";
import { created, parseBody, handleRoute } from "@/lib/api/utils";
import { createContactRequest } from "@/lib/services/contact-requests";
import { getTeamEmails, sendEmailSafe } from "@/lib/services/mailer";
import {
  contactConfirmationEmail,
  contactNotificationEmail,
} from "@/lib/services/mail-templates";

/**
 * Le formulaire public envoie sejour/autre (front) ; l'enum base
 * utilise stay/other — mapping côté API, le front ajustera ensuite.
 */
const requestTypeMapping = {
  circuit: "circuit",
  sejour: "stay",
  stay: "stay",
  hotel: "hotel",
  info: "info",
  autre: "other",
  other: "other",
} as const;

const bodySchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional(),
  subject: z.string().trim().max(255).optional(),
  requestType: z
    .enum(["circuit", "sejour", "stay", "hotel", "info", "autre", "other"])
    .default("info"),
  travelDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  travelers: z.coerce.number().int().min(1).max(100).optional(),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: Request) {
  return handleRoute(async () => {
    const [body, errorResponse] = await parseBody(request, bodySchema);
    if (errorResponse) return errorResponse;

    const contactRequest = await createContactRequest({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      subject: body.subject || null,
      requestType: requestTypeMapping[body.requestType],
      travelDate: body.travelDate ? new Date(body.travelDate) : null,
      travelers: body.travelers ?? null,
      message: body.message,
    });

    // Emails best effort (sendEmailSafe) : accusé de réception au visiteur +
    // notification interne — jamais bloquants pour la requête.
    await Promise.all([
      sendEmailSafe({
        to: contactRequest.email,
        ...contactConfirmationEmail({
          name: contactRequest.name,
          requestType: contactRequest.requestType,
        }),
      }),
      sendEmailSafe({
        to: getTeamEmails(),
        replyTo: contactRequest.email,
        ...contactNotificationEmail({
          name: contactRequest.name,
          email: contactRequest.email,
          phone: contactRequest.phone,
          subject: contactRequest.subject,
          requestType: contactRequest.requestType,
          travelDate: contactRequest.travelDate,
          travelers: contactRequest.travelers,
          message: contactRequest.message ?? "",
        }),
      }),
    ]);

    return created({
      message: "Demande envoyée avec succès",
      id: contactRequest.id,
    });
  });
}
