<?php

declare(strict_types=1);

namespace WT;

/**
 * JWT HS256 maison (~30 lignes) — compatible avec les tokens émis par
 * lib/auth.ts (jose, AUTH_SECRET) et vérifiables dans les deux sens :
 * mêmes header {alg,typ}, mêmes claims iat/exp.
 */
final class Jwt
{
    private static function b64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    private static function b64urlDecode(string $encoded): ?string
    {
        $decoded = base64_decode(strtr($encoded, '-_', '+/'), true);
        return $decoded === false ? null : $decoded;
    }

    /**
     * Signe un payload HS256 — ajoute iat et exp (7 jours par défaut),
     * comme SignJWT.setExpirationTime("7d").
     */
    public static function sign(array $payload, string $secret, int $ttlSeconds = 7 * 24 * 3600): string
    {
        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $ttlSeconds;

        $header = self::b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_UNESCAPED_SLASHES));
        $body = self::b64url(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $signature = self::b64url(hash_hmac('sha256', "$header.$body", $secret, true));

        return "$header.$body.$signature";
    }

    /**
     * Vérifie signature + expiration. Retourne le payload ou null —
     * toute anomalie (format, alg, signature, exp) vaut « non authentifié ».
     */
    public static function verify(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $body, $signature] = $parts;

        $headerRaw = self::b64urlDecode($header);
        $bodyRaw = self::b64urlDecode($body);
        $signatureRaw = self::b64urlDecode($signature);
        if ($headerRaw === null || $bodyRaw === null || $signatureRaw === null) {
            return null;
        }

        $headerData = json_decode($headerRaw, true);
        if (!is_array($headerData) || ($headerData['alg'] ?? null) !== 'HS256') {
            return null;
        }

        $expected = hash_hmac('sha256', "$header.$body", $secret, true);
        if (!hash_equals($expected, $signatureRaw)) {
            return null;
        }

        $payload = json_decode($bodyRaw, true);
        if (!is_array($payload)) {
            return null;
        }
        $exp = $payload['exp'] ?? null;
        if (!is_int($exp) || $exp <= time()) {
            return null;
        }

        return $payload;
    }
}
