<?php

declare(strict_types=1);

namespace WT;

/**
 * Tokens « mot de passe oublié » — port de lib/services/password-reset.ts :
 *   - le token brut (64 caractères hexadécimaux, 256 bits d'entropie) n'est
 *     JAMAIS stocké en base — seul son hash SHA-256 l'est ;
 *   - validité d'une heure, usage unique (consommation atomique) ;
 *   - toute nouvelle demande invalide les tokens précédents de l'utilisateur.
 */
final class PasswordReset
{
    /** Durée de validité d'un lien de réinitialisation, en minutes. */
    public const RESET_TOKEN_TTL_MINUTES = 60;

    /**
     * Crée un token de réinitialisation pour un utilisateur et retourne le
     * token brut (à inclure dans le lien envoyé par email). Les tokens
     * précédents non consommés de l'utilisateur sont supprimés : un seul
     * lien actif à la fois.
     */
    public static function createToken(string $userId): string
    {
        $rawToken = bin2hex(random_bytes(32)); // 64 hex, 256 bits — comme crypto.getRandomValues(32 octets)
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
            ->modify('+' . self::RESET_TOKEN_TTL_MINUTES . ' minutes')
            ->format('Y-m-d H:i:s.u');

        Db::transaction(static function () use ($userId, $tokenHash, $expiresAt): void {
            Db::run('DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL', [$userId]);
            Db::run(
                'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)'
                . ' VALUES (?, ?, ?, ?, ?)',
                [Db::uuid(), $userId, $tokenHash, $expiresAt, self::now()]
            );
        });

        return $rawToken;
    }

    /**
     * Consomme un token de réinitialisation (usage unique) et retourne l'id
     * de l'utilisateur concerné — null si le token est inconnu, expiré ou
     * déjà utilisé. La consommation est atomique (UPDATE conditionné sur
     * used_at IS NULL) pour résister à deux utilisations simultanées.
     */
    public static function consumeToken(string $rawToken): ?string
    {
        $tokenHash = hash('sha256', $rawToken);
        $record = Db::one(
            'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?',
            [$tokenHash]
        );
        if ($record === null || $record['used_at'] !== null || strtotime((string) $record['expires_at']) < time()) {
            return null;
        }

        $used = Db::run(
            'UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL',
            [self::now(), $record['id']]
        );
        if ($used->rowCount() === 0) {
            return null; // consommé entre-temps
        }

        return (string) $record['user_id'];
    }

    /** Purge des tokens expirés (appelée au passage sur chaque demande). */
    public static function deleteExpired(): int
    {
        return Db::run('DELETE FROM password_reset_tokens WHERE expires_at < ?', [self::now()])->rowCount();
    }

    private static function now(): string
    {
        return (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s.u');
    }
}
