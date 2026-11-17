<?php

/**
 * Sonde temporaire de diagnostic (à SUPPRIMER après le débogage) :
 * réinitialise l'OPcache du serveur et renvoie un statut JSON.
 * Sans danger : opcache_reset() vide seulement le cache de bytecode.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$status = [
    'php' => PHP_VERSION,
    'opcache_enabled' => function_exists('opcache_get_status')
        && is_array(opcache_get_status(false))
        && !empty(opcache_get_status(false)['opcache_enabled']),
];

if (function_exists('opcache_reset')) {
    $status['opcache_reset'] = opcache_reset();
}

echo json_encode($status, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
