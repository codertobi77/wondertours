<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Db;
use WT\External;
use WT\Http;
use WT\MailTemplates;
use WT\Password;
use WT\PasswordReset;
use WT\Router;
use WT\Support;
use WT\Validator;

/**
 * Authentification dashboard — port des routes app/api/auth/* :
 * login/logout (cookie wt_session, JWT HS256 compatible Next) et
 * forgot-password/reset-password (tokens SHA-256, usage unique).
 *
 * /api/auth/me est une extension PHP : le dashboard statique (export)
 * l'utilise comme garde client — session → {user} ou 401.
 */
final class AuthApi
{
    /** Anti-énumération : réponse identique que l'email existe ou non. */
    private const GENERIC_MESSAGE =
        "Si un compte actif existe avec cet email, un lien de réinitialisation vient d'être envoyé.";

    public static function registerRoutes(): void
    {
        Router::post('/api/auth/login', [self::class, 'login']);
        Router::post('/api/auth/logout', [self::class, 'logout']);
        Router::post('/api/auth/forgot-password', [self::class, 'forgotPassword']);
        Router::post('/api/auth/reset-password', [self::class, 'resetPassword']);
        Router::get('/api/auth/me', [self::class, 'me']);
    }

    /**
     * {user: {id, email, name, role}} depuis une ligne users — exactement
     * la forme de la route login Next (name = "Prénom Nom" trimmée).
     */
    private static function payload(array $user): array
    {
        $name = trim($user['first_name'] . ' ' . $user['last_name']);
        return [
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $name,
                'role' => $user['role'],
            ],
        ];
    }

    /**
     * POST /api/auth/login — email trim+lowercase (sans max, comme la route
     * Next), mot de passe 1..100 ; 401 générique si utilisateur inexistant,
     * inactif ou mot de passe invalide.
     */
    public static function login(): never
    {
        $v = Validator::body();
        $v->email('email', required: true, lowercase: true, max: null);
        $v->password('password', 1, 100);
        $v->fail();
        $data = $v->d();

        // verifyUserPassword : isActive contrôlé AVANT le mot de passe.
        $user = Db::one('SELECT * FROM users WHERE email = ?', [$data['email']]);
        if ($user === null
            || !Support::pgBool($user['is_active'])
            || !Password::verify($data['password'], (string) $user['password_hash'])) {
            Http::json(['error' => 'Email ou mot de passe incorrect.'], 401);
        }

        $token = Auth::issueToken([
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'name' => trim($user['first_name'] . ' ' . $user['last_name']),
        ]);
        // markUserLoggedIn — comme côté Next, avant la réponse.
        Db::run('UPDATE users SET last_login_at = ? WHERE id = ?', [Support::now(), $user['id']]);

        Auth::sendCookie($token);
        Http::ok(self::payload($user));
    }

    /** POST /api/auth/logout — {success: true} + cookie invalidé. */
    public static function logout(): never
    {
        Auth::clearCookie();
        Http::ok(['success' => true]);
    }

    /**
     * POST /api/auth/forgot-password — toujours 200 avec le message
     * générique ; purge opportuniste des tokens expirés et email
     * best effort si (et seulement si) un compte actif existe.
     */
    public static function forgotPassword(): never
    {
        $v = Validator::body();
        $v->email('email', required: true, lowercase: true, max: 255);
        $v->fail();
        $data = $v->d();

        // deleteExpiredPasswordResetTokens().catch(() => {}) — jamais bloquant.
        try {
            PasswordReset::deleteExpired();
        } catch (\Throwable) {
        }

        $user = Db::one('SELECT * FROM users WHERE email = ?', [$data['email']]);
        if ($user !== null && Support::pgBool($user['is_active'])) {
            $rawToken = PasswordReset::createToken($user['id']);
            $resetUrl = External::getAppUrl() . '/dashboard/reset-password?token=' . $rawToken;
            $email = MailTemplates::passwordResetEmail([
                'name' => $user['first_name'],
                'resetUrl' => $resetUrl,
                'expiresInMinutes' => PasswordReset::RESET_TOKEN_TTL_MINUTES,
            ]);
            External::sendEmailSafe([
                'to' => $user['email'],
                'subject' => $email['subject'],
                'html' => $email['html'],
            ]);
        }

        Http::ok(['message' => self::GENERIC_MESSAGE]);
    }

    /**
     * POST /api/auth/reset-password — token 64 hex (SHA-256, usage unique),
     * mot de passe 8..100 ; 400 « Lien invalide ou expiré… » si token
     * inconnu/expiré/consommé, 404 si l'utilisateur a disparu entre-temps.
     */
    public static function resetPassword(): never
    {
        $v = Validator::body();
        $v->token64('token');
        $v->password('password', 8, 100);
        $v->fail();
        $data = $v->d();

        $userId = PasswordReset::consumeToken($data['token']);
        if ($userId === null) {
            Http::badRequest(
                'Lien invalide ou expiré. Demandez un nouveau lien via « Mot de passe oublié ».'
            );
        }

        // updateUser (P2025 → 404 par défaut) — le hash bcrypt est réécrit.
        $user = Db::one(
            'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ? RETURNING *',
            [Password::hash($data['password']), Support::now(), $userId]
        );
        if ($user === null) {
            Http::notFound();
        }

        // Confirmation de sécurité (échec d'envoi sans impact).
        $email = MailTemplates::passwordResetConfirmationEmail(['name' => $user['first_name']]);
        External::sendEmailSafe([
            'to' => $user['email'],
            'subject' => $email['subject'],
            'html' => $email['html'],
        ]);

        Http::ok(['message' => 'Mot de passe modifié avec succès']);
    }

    /**
     * GET /api/auth/me (extension PHP) — session valide → {user} ; 401
     * sinon. Relit la ligne users : rôle/nom à jour, compte actif requis.
     */
    public static function me(): never
    {
        $session = Auth::session();
        if ($session === null) {
            Http::unauthorized();
        }
        $user = Db::one('SELECT * FROM users WHERE id = ?', [$session['sub']]);
        if ($user === null || !Support::pgBool($user['is_active'])) {
            Http::unauthorized();
        }
        Http::ok(self::payload($user));
    }
}
