<?php

declare(strict_types=1);

namespace WT;

/**
 * Réponses JSON — contrat strictement identique à lib/api/utils.ts (Next.js) :
 *   {error: "…"} en 400/401/403/404/409/500/503, {items, total, page, pageSize}
 *   pour les listes, 201 pour les créations.
 *
 * Encodage : JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES pour coller à
 * JSON.stringify (Node) — pas d'échappement des accents ni des « / ».
 */
final class Http
{
    private const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    /** Émet une réponse JSON et termine la requête. */
    public static function json(mixed $data, int $status = 200, array $headers = []): never
    {
        http_response_code($status);
        foreach ($headers as $header) {
            header($header);
        }
        header('Content-Type: application/json; charset=utf-8');
        try {
            echo json_encode($data, self::JSON_FLAGS | JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            http_response_code(500);
            echo '{"error":"Erreur interne du serveur"}';
        }
        exit;
    }

    public static function ok(mixed $data): never
    {
        self::json($data, 200);
    }

    public static function created(mixed $data): never
    {
        self::json($data, 201);
    }

    public static function badRequest(string $message, mixed $details = null): never
    {
        self::json($details !== null ? ['error' => $message, 'details' => $details] : ['error' => $message], 400);
    }

    public static function notFound(string $message = 'Ressource introuvable'): never
    {
        self::json(['error' => $message], 404);
    }

    public static function conflict(string $message): never
    {
        self::json(['error' => $message], 409);
    }

    public static function unauthorized(string $message = 'Authentification requise'): never
    {
        self::json(['error' => $message], 401);
    }

    public static function forbidden(string $message = 'Accès refusé'): never
    {
        self::json(['error' => $message], 403);
    }

    public static function serverError(string $message = 'Erreur interne du serveur'): never
    {
        self::json(['error' => $message], 500);
    }

    /** Dépendance externe absente / non configurée (ex. DEEPL_API_KEY manquante). */
    public static function serviceUnavailable(string $message = 'Service indisponible'): never
    {
        self::json(['error' => $message], 503);
    }

    // ─────────────────────────────── Entrées ───────────────────────────────

    /**
     * Corps JSON de la requête (POST/PATCH/PUT). Retourne null si le corps
     * est absent ou n'est pas un objet JSON — l'appelant renvoie alors
     * 400 « Corps JSON invalide », comme parseBody côté Next.
     */
    public static function jsonBody(): ?array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return null;
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }

    /** Query params bruts ($_GET). */
    public static function query(): array
    {
        return $_GET;
    }
}
