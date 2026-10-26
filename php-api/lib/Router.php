<?php

declare(strict_types=1);

namespace WT;

/**
 * Table de routes de l'API — équivalent du routage fichier d'App Router :
 *   GET/POST/PATCH/PUT/DELETE /api/… avec paramètres {name}.
 *
 * Inconnu en base → 404 {"error":"Route introuvable"} ; chemin connu avec
 * une autre méthode → 405 {"error":"Méthode non autorisée"}.
 */
final class Router
{
    /** @var array<int, array{0: string, 1: string, 2: mixed}> */
    private static array $routes = [];

    public static function get(string $pattern, mixed $handler): void
    {
        self::$routes[] = ['GET', $pattern, $handler];
    }

    public static function post(string $pattern, mixed $handler): void
    {
        self::$routes[] = ['POST', $pattern, $handler];
    }

    public static function put(string $pattern, mixed $handler): void
    {
        self::$routes[] = ['PUT', $pattern, $handler];
    }

    public static function patch(string $pattern, mixed $handler): void
    {
        self::$routes[] = ['PATCH', $pattern, $handler];
    }

    public static function delete(string $pattern, mixed $handler): void
    {
        self::$routes[] = ['DELETE', $pattern, $handler];
    }

    /** Exécute la première route correspondante (les handlers terminent la requête). */
    public static function dispatch(string $method, string $path): void
    {
        $pathMatched = false;
        foreach (self::$routes as [$routeMethod, $pattern, $handler]) {
            $params = self::match($pattern, $path);
            if ($params === null) {
                continue;
            }
            if ($routeMethod !== $method) {
                $pathMatched = true;
                continue;
            }
            ($handler)(...array_values($params));

            return;
        }
        if ($pathMatched) {
            Http::json(['error' => 'Méthode non autorisée'], 405);
        }
        Http::notFound('Route introuvable');
    }

    /** @return array<string,string>|null paramètres nommés, null si le chemin ne correspond pas */
    private static function match(string $pattern, string $path): ?array
    {
        if ($pattern === $path) {
            return [];
        }
        if (!str_contains($pattern, '{')) {
            return null;
        }
        $regex = '#^' . preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $pattern) . '$#';
        if (preg_match($regex, $path, $m) !== 1) {
            return null;
        }
        $named = [];
        foreach ($m as $key => $value) {
            if (is_string($key)) {
                $named[$key] = $value;
            }
        }
        return $named;
    }
}
