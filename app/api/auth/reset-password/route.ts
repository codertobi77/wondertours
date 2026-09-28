import { z } from "zod";
import { ok, badRequest, parseBody, handleRoute } from "@/lib/api/utils";
import { updateUser } from "@/lib/services/users";
import { consumePasswordResetToken } from "@/lib/services/password-reset";
import { sendEmailSafe } from "@/lib/services/mailer";
import { passwordResetConfirmationEmail } from "@/lib/services/mail-templates";

const resetSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{64}$/i, "Token invalide"),
  password: z.string().min(8, "8 caractères minimum").max(100),
});

export async function POST(request: Request) {
  return handleRoute(async () => {
    const [body, errorResponse] = await parseBody(request, resetSchema);
    if (errorResponse) return errorResponse;

    const userId = await consumePasswordResetToken(body.token);
    if (!userId) {
      return badRequest(
        "Lien invalide ou expiré. Demandez un nouveau lien via « Mot de passe oublié »."
      );
    }

    // updateUser re-hash le mot de passe (bcrypt) — lib/services/users.ts.
    const user = await updateUser(userId, { password: body.password });

    // Confirmation de sécurité (échec d'envoi sans impact sur la requête).
    await sendEmailSafe({
      to: user.email,
      ...passwordResetConfirmationEmail({ name: user.firstName }),
    });

    return ok({ message: "Mot de passe modifié avec succès" });
  });
}
