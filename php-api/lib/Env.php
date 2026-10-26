<?php

declare(strict_types=1);

namespace WT;

/**
 * Configuration de l'API PHP — résolution dans cet ordre :
 *   1. `config.local.php` (gitignoré, à côté de index.php) ;
 *   2. variable d'environnement du même nom (DATABASE_URL, AUTH_SECRET…) ;
 *   3. défaut intégré (cf. DEFAULTS).
 *
 * Noms des clés (config.local.php) :
 *   database_url, auth_secret, app_url, mail_from, mail_team_email,
 *   resend_api_key, imgbb_api_key, deepl_api_key, uploads_dir,
 *   secure_cookies, timezone, debug_log
 */
final class Env
{
    private const DEFAULTS = [
        'app_url' => 'https://wondertoursandservices.com',
        'mail_from' => 'Wonder Tours <onboarding@resend.dev>',
        'mail_team_email' => 'contact@wondertoursandservices.com',
        'timezone' => 'UTC',
    ];

    private static ?array $file = null;
    private static bool $fileLoaded = false;

    private static function loadFile(): void
    {
        if (self::$fileLoaded) {
            return;
        }
        self::$fileLoaded = true;
        $path = dirname(__DIR__) . '/config.local.php';
        if (is_file($path)) {
            $config = require $path;
            self::$file = is_array($config) ? $config : [];
        }
    }

    /** Valeur d'une clé, avec repli getenv puis défaut intégré. */
    public static function get(string $key): ?string
    {
        self::loadFile();
        $value = self::$file[$key] ?? null;
        if ($value === null || $value === '') {
            $value = getenv(strtoupper($key));
            if ($value === false || $value === '') {
                $value = self::DEFAULTS[$key] ?? null;
            }
        }
        return $value !== null ? (string) $value : null;
    }

    /** Clé obligatoire — lève si absente (500 en production). */
    public static function require(string $key): string
    {
        $value = self::get($key);
        if ($value === null || $value === '') {
            throw new \RuntimeException("Configuration manquante : $key (config.local.php ou variable d'environnement)");
        }
        return $value;
    }

    public static function bool(string $key, bool $default): bool
    {
        $value = self::get($key);
        if ($value === null) {
            return $default;
        }
        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    /** true si une clé externe est configurée (Resend, imgBB, DeepL…). */
    public static function has(string $key): bool
    {
        $value = self::get($key);
        return $value !== null && $value !== '';
    }
}
