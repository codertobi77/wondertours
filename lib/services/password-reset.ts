import { prisma } from "@/lib/db";

/**
 * Tokens « mot de passe oublié » :
 * - le token brut (64 caractères hexadécimaux, 256 bits d'entropie) n'est
 *   JAMAIS stocké en base — seul son hash SHA-256 l'est ;
 * - validité d'une heure, usage unique (consommation atomique) ;
 * - toute nouvelle demande invalide les tokens précédents de l'utilisateur.
 */

/** Durée de validité d'un lien de réinitialisation, en minutes. */
export const RESET_TOKEN_TTL_MINUTES = 60;

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Crée un token de réinitialisation pour un utilisateur et retourne le token
 * brut (à inclure dans le lien envoyé par email). Les tokens précédents non
 * consommés de l'utilisateur sont supprimés : un seul lien actif à la fois.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const tokenHash = await sha256Hex(rawToken);
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
  );

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return rawToken;
}

/**
 * Consomme un token de réinitialisation (usage unique) et retourne l'id de
 * l'utilisateur concerné — null si le token est inconnu, expiré ou déjà utilisé.
 * La consommation est atomique (`updateMany` conditionné sur `usedAt: null`)
 * pour résister à deux utilisations simultanées.
 */
export async function consumePasswordResetToken(
  rawToken: string
): Promise<string | null> {
  const tokenHash = await sha256Hex(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;

  const result = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (result.count === 0) return null; // consommé entre-temps

  return record.userId;
}

/** Purge des tokens expirés (appelée au passage sur chaque demande). */
export async function deleteExpiredPasswordResetTokens(): Promise<number> {
  const { count } = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
