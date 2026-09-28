import { describe, expect, test } from "bun:test";
import { prisma } from "@/lib/db";
import { createUser, deleteUser, verifyUserPassword } from "@/lib/services/users";
import {
  RESET_TOKEN_TTL_MINUTES,
  consumePasswordResetToken,
  createPasswordResetToken,
  deleteExpiredPasswordResetTokens,
} from "@/lib/services/password-reset";
import { uniquePrefix } from "./helpers";

// Même principe que tests/users-media.test.ts : base réelle (locale ou CI),
// données de test nettoyées en finally (la suppression de l'utilisateur
// cascade sur ses tokens).

describe("password-reset", () => {
  test("cycle complet : hash stocké, consommation, usage unique, TTL", async () => {
    const email = `${uniquePrefix("reset")}@wondertours.bj`;
    const user = await createUser({
      email,
      password: "motdepasse123",
      firstName: "Reset",
      lastName: "Test",
    });

    try {
      const token = await createPasswordResetToken(user.id);
      expect(token).toMatch(/^[0-9a-f]{64}$/);

      // Seul le hash SHA-256 est stocké — jamais le token brut.
      const stored = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id },
      });
      expect(stored).not.toBeNull();
      expect(stored!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(stored!.tokenHash).not.toBe(token);
      expect(stored!.usedAt).toBeNull();

      // TTL : expiresAt ≈ now + 60 min.
      const ttlMs =
        stored!.expiresAt.getTime() - stored!.createdAt.getTime();
      expect(ttlMs).toBeGreaterThanOrEqual(
        (RESET_TOKEN_TTL_MINUTES - 1) * 60 * 1000
      );
      expect(ttlMs).toBeLessThanOrEqual(RESET_TOKEN_TTL_MINUTES * 60 * 1000);

      // Consommation → utilisateur ; réutilisation → refus (usage unique).
      expect(await consumePasswordResetToken(token)).toBe(user.id);
      expect(await consumePasswordResetToken(token)).toBeNull();

      // Token inconnu → refus.
      expect(await consumePasswordResetToken("0".repeat(64))).toBeNull();
    } finally {
      await deleteUser(user.id);
    }

    // Cascade : plus aucun token pour l'utilisateur supprimé.
    expect(
      await prisma.passwordResetToken.count({ where: { userId: user.id } })
    ).toBe(0);
  });

  test("nouvelle demande invalide les tokens précédents ; expiration refusée", async () => {
    const email = `${uniquePrefix("reset2")}@wondertours.bj`;
    const user = await createUser({
      email,
      password: "motdepasse123",
      firstName: "Reset",
      lastName: "Test",
    });

    try {
      const token1 = await createPasswordResetToken(user.id);
      await createPasswordResetToken(user.id); // nouvelle demande
      // Un seul token actif : le premier lien est mort.
      expect(
        await prisma.passwordResetToken.count({
          where: { userId: user.id, usedAt: null },
        })
      ).toBe(1);
      expect(await consumePasswordResetToken(token1)).toBeNull();

      // Token expiré → refus.
      const token2 = await createPasswordResetToken(user.id);
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      expect(await consumePasswordResetToken(token2)).toBeNull();

      // Purge des expirés.
      expect(await deleteExpiredPasswordResetTokens()).toBeGreaterThan(0);
      expect(
        await prisma.passwordResetToken.count({ where: { userId: user.id } })
      ).toBe(0);
    } finally {
      await deleteUser(user.id);
    }
  });

  test("intégration : reset via updateUser change le mot de passe vérifiable", async () => {
    const email = `${uniquePrefix("reset3")}@wondertours.bj`;
    const user = await createUser({
      email,
      password: "motdepasse123",
      firstName: "Reset",
      lastName: "Test",
    });

    try {
      const token = await createPasswordResetToken(user.id);
      expect(await consumePasswordResetToken(token)).toBe(user.id);

      const { updateUser } = await import("@/lib/services/users");
      await updateUser(user.id, { password: "nouveaumotdepasse" });
      expect(await verifyUserPassword(email, "nouveaumotdepasse")).not.toBeNull();
      expect(await verifyUserPassword(email, "motdepasse123")).toBeNull();
    } finally {
      await deleteUser(user.id);
    }
  });
});
