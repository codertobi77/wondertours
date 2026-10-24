<?php

declare(strict_types=1);

namespace WT;

/**
 * Accès PostgreSQL via PDO — URI Aiven (sslmode=require géré par libpq),
 * fuseau horaire de session UTC (rendu déterministe des timestamptz),
 * requêtes préparées natives.
 *
 * Équivalent PDO des erreurs Prisma :
 *   SQLSTATE 23505 → 409 (P2002, unicité) ; 23503 → 400 (P2003, clé
 *   étrangère) ; ligne absente → 404 (P2025, géré par RETURNING vide).
 */
final class Db
{
    private static ?\PDO $pdo = null;

    public static function pdo(): \PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $url = Env::require('database_url');
        $parts = parse_url($url);
        if ($parts === false || empty($parts['host']) || empty($parts['user'])) {
            throw new \RuntimeException('database_url illisible (schema://user:pass@host:port/base attendu)');
        }

        $query = [];
        if (isset($parts['query'])) {
            parse_str($parts['query'], $query);
        }
        $sslmode = $query['sslmode'] ?? 'require';

        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s;connect_timeout=15',
            $parts['host'],
            isset($parts['port']) ? (int) $parts['port'] : 5432,
            isset($parts['path']) && ltrim($parts['path'], '/') !== '' ? ltrim($parts['path'], '/') : 'postgres',
            $sslmode
        );

        $pdo = new \PDO(
            $dsn,
            rawurldecode($parts['user']),
            isset($parts['pass']) ? rawurldecode($parts['pass']) : '',
            [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        // Rendu déterministe des timestamptz : toujours « …+00 » en UTC.
        $pdo->exec("SET TIME ZONE 'UTC'");

        self::$pdo = $pdo;
        return $pdo;
    }

    public static function run(string $sql, array $params = []): \PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /** Toutes les lignes (fetch associatif). */
    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll(\PDO::FETCH_ASSOC);
    }

    /** Première ligne ou null. */
    public static function one(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch(\PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    /** Première colonne de la première ligne. */
    public static function val(string $sql, array $params = []): mixed
    {
        $value = self::run($sql, $params)->fetchColumn();
        return $value === false ? null : $value;
    }

    /** Transaction (immuable si une exception est levée). */
    public static function transaction(callable $fn): mixed
    {
        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $result = $fn();
            $pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Mapping PDO → HTTP pour les erreurs connues. Retourne true si une
     * réponse a été émise (équivalent prismaErrorResponse).
     */
    public static function handleError(\Throwable $e): bool
    {
        if (!$e instanceof \PDOException) {
            return false;
        }
        $sqlstate = is_array($e->errorInfo) ? ($e->errorInfo[0] ?? null) : null;
        if ($sqlstate === '23505') {
            Http::conflict('Contrainte d\'unicité violée (' . self::uniqueTarget($e) . ')');
        }
        if ($sqlstate === '23503') {
            Http::badRequest('Référence invalide (clé étrangère)');
        }
        return false;
    }

    /** Colonne(s) en cause dans une violation d'unicité (message DETAIL). */
    private static function uniqueTarget(\PDOException $e): string
    {
        if (preg_match('/Key \(([^)]+)\)=/', $e->getMessage(), $m)) {
            return str_replace(', ', ', ', $m[1]);
        }
        return 'champ unique';
    }

    /** UUID v4 aléatoire (équivalent Prisma uuid()). */
    public static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
