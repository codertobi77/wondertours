<?php

declare(strict_types=1);

namespace WT;

/**
 * Session cookie `wt_session` — mêmes attributs que lib/auth.ts :
 * httpOnly, secure (production), sameSite=lax, path=/, 7 jours.
 * Payload JWT minimal {sub, email, role, name?} contrôlé à la lecture
 * (équivalent toSession) : un payload non conforme vaut « non authentifié ».
 */
final class Auth
{
    public const COOKIE_NAME = 'wt_session';
    private const TTL_SECONDS = 7 * 24 * 3600;
    private const ROLES = ['admin', 'editor', 'viewer'];

    /** Attributs du cookie, dans l'ordre exact produit par lib/auth.ts. */
    private static function cookieAttributes(): string
    {
        $secure = Env::bool('secure_cookies', str_starts_with((string) Env::get('app_url'), 'https://'));
        return 'httpOnly=true'
            . '; secure=' . ($secure ? 'true' : 'false')
            . '; sameSite=lax; path=/; maxAge=' . self::TTL_SECONDS;
    }

    /** Émet le cookie de session (login). */
    public static function sendCookie(string $token): void
    {
        header('Set-Cookie: ' . self::COOKIE_NAME . '=' . $token . '; ' . self::cookieAttributes());
    }

    /** Invalide le cookie (logout) — format de lib/auth.ts (unsetSessionCookie). */
    public static function clearCookie(): void
    {
        $secure = Env::bool('secure_cookies', str_starts_with((string) Env::get('app_url'), 'https://'));
        header(
            'Set-Cookie: ' . self::COOKIE_NAME . '=deleted; httpOnly=true'
            . '; secure=' . ($secure ? 'true' : 'false')
            . '; sameSite=lax; path=/; maxAge=0; Max-Age=0'
        );
    }

    /** Token de session pour {sub, email, role, name?}. */
    public static function issueToken(array $user): string
    {
        $payload = [
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'name' => $user['name'],
        ];
        return Jwt::sign($payload, Env::require('auth_secret'), self::TTL_SECONDS);
    }

    /**
     * Session depuis le cookie de la requête — null si absente/invalide
     * (équivalent getSessionFromRequest + toSession).
     */
    public static function session(): ?array
    {
        $token = $_COOKIE[self::COOKIE_NAME] ?? null;
        if (!is_string($token) || $token === '') {
            return null;
        }
        $payload = Jwt::verify($token, Env::require('auth_secret'));
        if ($payload === null) {
            return null;
        }
        // toSession : sub/email chaînes, rôle connu, name optionnel.
        if (!is_string($payload['sub'] ?? null) || !is_string($payload['email'] ?? null)
            || !in_array($payload['role'] ?? null, self::ROLES, true)) {
            return null;
        }
        $session = ['sub' => $payload['sub'], 'email' => $payload['email'], 'role' => $payload['role']];
        if (is_string($payload['name'] ?? null)) {
            $session['name'] = $payload['name'];
        }
        return $session;
    }

    /**
     * Garde de route (équivalent handleProtectedRoute) : 401 sans session
     * valide, 403 si le rôle n'est pas dans $roles (null = tout rôle
     * authentifié). Retourne la session.
     */
    public static function requireSession(?array $roles = null): array
    {
        $session = self::session();
        if ($session === null) {
            Http::unauthorized();
        }
        if ($roles !== null && !in_array($session['role'], $roles, true)) {
            Http::forbidden();
        }
        return $session;
    }
}
