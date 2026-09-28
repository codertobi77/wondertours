import { z } from "zod";
import { ok, parseBody, handleRoute } from "@/lib/api/utils";
import { getUserByEmail } from "@/lib/services/users";
import {
  createPasswordResetToken,
  deleteExpiredPasswordResetTokens,
  RESET_TOKEN_TTL_MINUTES,
} from "@/lib/services/password-reset";
import { getAppUrl, sendEmailSafe } from "@/lib/services/mailer";
import { passwordResetEmail } from "@/lib/services/mail-templates";

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

/**
 * Message générique identique que l'email existe ou non : ne pas révéler
 * si un compte existe (anti-énumération), même contrainte que /api/auth/login.
 */
const GENERIC_MESSAGE =
  "Si un compte actif existe avec cet email, un lien de réinitialisation vient d'être envoyé.";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const [body, errorResponse] = await parseBody(request, forgotSchema);
    if (errorResponse) return errorResponse;

    // Purge opportuniste des tokens expirés — sans bloquer la requête.
    await deleteExpiredPasswordResetTokens().catch(() => {});

    const user = await getUserByEmail(body.email);
    if (user?.isActive) {
      const rawToken = await createPasswordResetToken(user.id);
      const resetUrl = `${getAppUrl()}/dashboard/reset-password?token=${rawToken}`;
      await sendEmailSafe({
        to: user.email,
        ...passwordResetEmail({
          name: user.firstName,
          resetUrl,
          expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
        }),
      });
    }

    return ok({ message: GENERIC_MESSAGE });
  });
}
