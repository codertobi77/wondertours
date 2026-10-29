<?php

declare(strict_types=1);

namespace WT;

/**
 * Moteur CRUD générique des ressources dashboard — remplace les paires
 * app/api/dashboard/<ressource>/(route.ts|[id]/route.ts) avec un
 * comportement unique : garde de rôle, validation zod, slug unique,
 * réponses JSON du contrat (docs/api.md).
 *
 * Spécification par ressource (cf. DashboardApi::registerRoutes) :
 *   table, map (Model::*), serializer [Serial::class, '…'],
 *   label ("Circuit" → « Circuit introuvable »), deletedMessage,
 *   search (colonnes ILIKE de q), orderBy (fragment SQL),
 *   roles (écriture — défaut admin+editor),
 *   slugTable/slugSource (Slug::uniqueSlug ; null si sans slug),
 *   joins/relationColumns (relations sérialisées sur liste et GET /[id]),
 *   create/update ([Schemas::class, '…']),
 *   relations (sérialisation groupée liste/GET, ex. catégories m-n des
 *     circuits — remplace l'appel direct au serializer),
 *   afterCreate/afterUpdate (écritures de relation, ex. categoryIds),
 *   patchFetch/deleteFetch (pré-lecture avant écriture — reproduit la
 *     divergence Next : 404 « <label> introuvable » vs « Ressource
 *     introuvable » selon les routes),
 *   beforeCreate/beforeUpdate (règles métier, ex. publishedAt du blog).
 */
final class Crud
{
    private static array $specs = [];

    public static function register(string $resource, array $spec): void
    {
        self::$specs[$resource] = $spec + [
            'roles' => ['admin', 'editor'],
            'slugTable' => null,
            'slugSource' => null,
            'joins' => '',
            'relationColumns' => '',
            'patchFetch' => false,
            'deleteFetch' => false,
            'rebuild' => false,
            'beforeCreate' => null,
            'beforeUpdate' => null,
            'relations' => null,
            'afterCreate' => null,
            'afterUpdate' => null,
        ];
    }

    private static function spec(string $resource): array
    {
        return self::$specs[$resource]
            ?? throw new \RuntimeException("Ressource CRUD inconnue : $resource");
    }

    // ─────────────────────────────── GET liste ───────────────────────────────

    /** GET /api/dashboard/<ressource> — toutes lignes (actives ou non), tout rôle authentifié. */
    public static function list(string $resource): never
    {
        $spec = self::spec($resource);
        Auth::requireSession();

        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $v->fail();

        [$whereSql, $params] = self::searchWhere($spec, $q);
        $rows = Db::all(
            self::selectSql($spec) . $whereSql
            . ' ORDER BY ' . $spec['orderBy']
            . ' LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
            $params
        );
        $total = (int) Db::val(
            'SELECT COUNT(*) FROM ' . $spec['table'] . ' t' . $whereSql,
            $params
        );

        $serializer = $spec['serializer'];
        $items = $spec['relations'] !== null
            ? ($spec['relations'])($rows)
            : array_map(static fn (array $row): array => $serializer($row, true), $rows);
        Http::ok(Serial::list($items, $total, $page, $pageSize));
    }

    // ─────────────────────────────── POST ───────────────────────────────

    /** POST /api/dashboard/<ressource> — 201 avec la ligne créée (sans relations, comme Prisma). */
    public static function create(string $resource): never
    {
        $spec = self::spec($resource);
        Auth::requireSession($spec['roles']);

        $v = Validator::body();
        $data = ($spec['create'])($v);
        $v->fail();

        $row = self::toRow($spec['map'], $data);
        if ($spec['slugTable'] !== null) {
            $row['slug'] = Slug::uniqueSlug($spec['slugTable'], $data[$spec['slugSource']]);
        }
        $row['id'] = Db::uuid();
        $now = self::now();
        $row['created_at'] = $now;
        $row['updated_at'] = $now;
        if ($spec['beforeCreate'] !== null) {
            $row = ($spec['beforeCreate'])($row, $data);
        }

        $inserted = Db::transaction(static function () use ($spec, $row, $data): ?array {
            $columns = implode(', ', array_keys($row));
            $placeholders = implode(', ', array_fill(0, count($row), '?'));
            $inserted = Db::one(
                'INSERT INTO ' . $spec['table'] . ' (' . $columns . ') VALUES (' . $placeholders . ') RETURNING *',
                array_values($row)
            );
            // Écritures de relation (categoryIds m-n) dans la même transaction.
            if ($spec['afterCreate'] !== null) {
                ($spec['afterCreate'])($row['id'], $data);
            }
            return $inserted;
        });
        Http::created(($spec['serializer'])($inserted, false));
        if ($spec['rebuild']) {
            \WT\External::triggerRebuild();
        }
    }

    // ─────────────────────────────── GET /{id} ───────────────────────────────

    /** GET /api/dashboard/<ressource>/{id} — ligne avec relations (circuits, blog). */
    public static function get(string $resource, string $id): never
    {
        $spec = self::spec($resource);
        Auth::requireSession();

        if (!self::isUuid($id)) {
            Http::notFound($spec['label'] . ' introuvable');
        }
        $row = Db::one(self::selectSql($spec) . ' WHERE t.id = ?', [$id]);
        if ($row === null) {
            Http::notFound($spec['label'] . ' introuvable');
        }
        Http::ok($spec['relations'] !== null
            ? ($spec['relations'])([$row])[0]
            : ($spec['serializer'])($row, true));
    }

    // ─────────────────────────────── PATCH /{id} ───────────────────────────────

    /** PATCH /api/dashboard/<ressource>/{id} — partiel, slug régénéré si titre/nom fourni. */
    public static function update(string $resource, string $id): never
    {
        $spec = self::spec($resource);
        Auth::requireSession($spec['roles']);

        if (!self::isUuid($id)) {
            Http::notFound($spec['label'] . ' introuvable');
        }
        $v = Validator::body();
        $data = ($spec['update'])($v);
        $v->fail();

        $existing = null;
        if ($spec['patchFetch']) {
            $existing = Db::one('SELECT * FROM ' . $spec['table'] . ' WHERE id = ?', [$id]);
            if ($existing === null) {
                Http::notFound($spec['label'] . ' introuvable');
            }
        }

        $row = self::toRow($spec['map'], $data);
        if ($spec['slugTable'] !== null && isset($data[$spec['slugSource']])) {
            $row['slug'] = Slug::uniqueSlug($spec['slugTable'], $data[$spec['slugSource']], $id);
        }
        if ($spec['beforeUpdate'] !== null) {
            $row = ($spec['beforeUpdate'])($row, $existing, $data);
        }
        $row['updated_at'] = self::now();

        $updated = Db::transaction(static function () use ($spec, $row, $id, $data): ?array {
            $set = implode(', ', array_map(static fn (string $column): string => "$column = ?", array_keys($row)));
            $updated = Db::one(
                'UPDATE ' . $spec['table'] . ' SET ' . $set . ' WHERE id = ? RETURNING *',
                [...array_values($row), $id]
            );
            // Écritures de relation (categoryIds m-n) dans la même transaction,
            // seulement si la ligne existe (sinon Prisma lève P2025).
            if ($updated !== null && $spec['afterUpdate'] !== null) {
                ($spec['afterUpdate'])($id, $data);
            }
            return $updated;
        });
        if ($updated === null) {
            // Équivalent P2025 : ligne absente au moment de l'écriture.
            Http::notFound();
        }
        Http::ok(($spec['serializer'])($updated, false));
        if ($spec['rebuild']) {
            \WT\External::triggerRebuild();
        }
    }

    // ─────────────────────────────── DELETE /{id} ───────────────────────────────

    /** DELETE /api/dashboard/<ressource>/{id} — {message:"<label> supprimé", id}. */
    public static function delete(string $resource, string $id): never
    {
        $spec = self::spec($resource);
        Auth::requireSession($spec['roles']);

        if (!self::isUuid($id)) {
            Http::notFound($spec['label'] . ' introuvable');
        }
        if ($spec['deleteFetch']) {
            if (Db::one('SELECT id FROM ' . $spec['table'] . ' WHERE id = ?', [$id]) === null) {
                Http::notFound($spec['label'] . ' introuvable');
            }
            Db::run('DELETE FROM ' . $spec['table'] . ' WHERE id = ?', [$id]);
        } else {
            $deleted = Db::one('DELETE FROM ' . $spec['table'] . ' WHERE id = ? RETURNING id', [$id]);
            if ($deleted === null) {
                Http::notFound();
            }
        }
        Http::ok(['message' => $spec['deletedMessage'], 'id' => $id]);
        if ($spec['rebuild']) {
            \WT\External::triggerRebuild();
        }
    }

    // ─────────────────────────────── Internes ───────────────────────────────

    /** SELECT principal, relations jointes si la ressource en sérialise. */
    private static function selectSql(array $spec): string
    {
        $sql = $spec['relationColumns'] !== ''
            ? 'SELECT t.*, ' . $spec['relationColumns']
            : 'SELECT t.*';
        $sql .= ' FROM ' . $spec['table'] . ' t';
        if ($spec['joins'] !== '') {
            $sql .= ' ' . $spec['joins'];
        }
        return $sql;
    }

    /** @return array{0: string, 1: array<int, string>} WHERE de recherche + params */
    private static function searchWhere(array $spec, ?string $q): array
    {
        if ($q === null) {
            return ['', []];
        }
        $conditions = [];
        $params = [];
        foreach ($spec['search'] as $column) {
            $conditions[] = "t.$column ILIKE ?";
            $params[] = '%' . $q . '%';
        }
        return [' WHERE (' . implode(' OR ', $conditions) . ')', $params];
    }

    /**
     * Données validées camelCase → ligne SQL (colonnes snake via la carte
     * Model). Colonnes Json encodées ; booléens en littéraux 'true'/'false'
     * (liaison PDO/pgsql déterministe).
     */
    private static function toRow(array $map, array $data): array
    {
        $row = [];
        foreach ($map as $column => $camelSpec) {
            [$camel, $type] = is_string($camelSpec) ? [$camelSpec, 'raw'] : $camelSpec;
            if (!array_key_exists($camel, $data)) {
                continue;
            }
            $value = $data[$camel];
            if ($type === 'json') {
                $row[$column] = $value === null
                    ? null
                    : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            } elseif (is_bool($value)) {
                $row[$column] = $value ? 'true' : 'false';
            } else {
                $row[$column] = $value;
            }
        }
        return $row;
    }

    private static function isUuid(string $value): bool
    {
        return preg_match(
            '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/',
            $value
        ) === 1;
    }

    /** Horodatage UTC microsecondes — @default(now())/@updatedAt de Prisma. */
    private static function now(): string
    {
        return (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s.u');
    }
}
