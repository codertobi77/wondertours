<?php

declare(strict_types=1);

namespace WT;

/**
 * Aides transversales des handlers — factorisées depuis PublicApi pour
 * les nouvelles routes (auth, dashboard dédiés).
 */
final class Support
{
    /** Horodatage UTC microsecondes — @default(now())/@updatedAt de Prisma. */
    public static function now(): string
    {
        return (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s.u');
    }

    /** Booléen PDO/pgsql ('t'/'f', true/false, '1'/'0'). */
    public static function pgBool(mixed $value): bool
    {
        return $value === true || $value === 't' || $value === 1 || $value === '1';
    }

    /** équivalent JS `x || null` sur les chaînes trimmées : "" → null. */
    public static function emptyToNull(?string $value): ?string
    {
        return $value === '' ? null : $value;
    }

    /**
     * Nombre JSON « à la JS » : JSON.stringify émet les flottants entiers
     * comme des entiers (4.0 → « 4 ») alors que json_encode émet « 4.0 » —
     * normalise pour garder le contrat exact (stats : averageRating,
     * revenueThisMonth…).
     */
    public static function number(float $value): int|float
    {
        return floor($value) === $value ? (int) $value : $value;
    }

    /** UUID — garde des routes /{id} (uuidSchema zod). */
    public static function isUuid(string $value): bool
    {
        return preg_match(
            '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/',
            $value
        ) === 1;
    }
}
