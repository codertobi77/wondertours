<?php

declare(strict_types=1);

/**
 * Routeur de développement — `php -S 127.0.0.1:8099 router-dev.php`
 * (à lancer depuis php-api/). Les chemins /api/* passent par le front
 * controller, tout le reste est servi tel quel (fichiers statiques).
 */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (is_string($path) && preg_match('#^/api(/|$)#', $path) === 1) {
    require __DIR__ . '/index.php';
    return true;
}
return false;
