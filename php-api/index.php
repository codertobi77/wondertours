<?php

declare(strict_types=1);

/**
 * Front controller de l'API PHP — unique point d'entrée :
 *   - production : Apache route /api/* ici (cf. .htaccess, Phase D) ;
 *   - développement : `php -S 127.0.0.1:8099 router-dev.php`.
 *
 * Toutes les réponses sont JSON, contrat identique à la stack Next.js
 * (docs/api.md) : 409/400 sur contraintes PG, 500 générique sinon.
 */

spl_autoload_register(static function (string $class): void {
    $file = null;
    if (str_starts_with($class, 'WT\\Handlers\\')) {
        $file = __DIR__ . '/handlers/' . str_replace('\\', '/', substr($class, strlen('WT\\Handlers\\'))) . '.php';
    } elseif (str_starts_with($class, 'WT\\')) {
        $file = __DIR__ . '/lib/' . str_replace('\\', '/', substr($class, strlen('WT\\'))) . '.php';
    }
    if ($file !== null && is_file($file)) {
        require $file;
    }
});

use WT\Env;
use WT\Http;
use WT\Router;
use WT\Handlers\AuthApi;
use WT\Handlers\BookingsApi;
use WT\Handlers\ContactRequestsApi;
use WT\Handlers\DashboardApi;
use WT\Handlers\MediaApi;
use WT\Handlers\PublicApi;
use WT\Handlers\SettingsApi;
use WT\Handlers\StatsApi;
use WT\Handlers\TranslateApi;
use WT\Handlers\UsersApi;

ini_set('display_errors', '0');
$debugLog = Env::get('debug_log');
if ($debugLog !== null && $debugLog !== '') {
    ini_set('error_log', $debugLog);
}
date_default_timezone_set(Env::get('timezone') ?? 'UTC');

// ─────────────────────────────── Routes ───────────────────────────────

// Public — Phase A : circuits. Phase B : destinations, categories,
// services, témoignages, blog (+ compteur de vues), POST contact, POST bookings.
Router::get('/api/circuits', [PublicApi::class, 'circuits']);
Router::get('/api/circuits/{slug}', [PublicApi::class, 'circuitBySlug']);
Router::get('/api/destinations', [PublicApi::class, 'destinations']);
Router::get('/api/categories', [PublicApi::class, 'categories']);
Router::get('/api/services', [PublicApi::class, 'services']);
Router::get('/api/testimonials', [PublicApi::class, 'testimonials']);
Router::get('/api/blog', [PublicApi::class, 'blog']);
Router::get('/api/blog/{slug}', [PublicApi::class, 'blogBySlug']);
Router::get('/api/blog-categories', [PublicApi::class, 'blogCategories']);
Router::get('/api/settings', [PublicApi::class, 'settings']);
Router::post('/api/contact', [PublicApi::class, 'contact']);
Router::post('/api/bookings', [PublicApi::class, 'bookings']);

// Authentification dashboard (cookie wt_session) : login/logout,
// forgot/reset + GET /api/auth/me — garde client du frontend statique.
AuthApi::registerRoutes();

// Dashboard — CRUD génériques (7 ressources), puis endpoints dédiés
// (rôles par route : users écritures admin, settings/stats lecture
// authentifiée, media/translate admin+éditeur…).
DashboardApi::registerRoutes();
BookingsApi::registerRoutes();
ContactRequestsApi::registerRoutes();
MediaApi::registerRoutes();
SettingsApi::registerRoutes();
StatsApi::registerRoutes();
TranslateApi::registerRoutes();
UsersApi::registerRoutes();

// ─────────────────────────────── Dispatch ───────────────────────────────

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (!is_string($path) || $path === '') {
    $path = '/';
}

try {
    Router::dispatch($method, $path);
} catch (\Throwable $e) {
    // 23505 → 409 (P2002), 23503 → 400 (P2003) — Http::termine la requête.
    \WT\Db::handleError($e);
    error_log('[api] ' . $e);
    Http::serverError();
}
