<?php

declare(strict_types=1);

namespace WT;

/**
 * Relation m-n circuit ↔ catégories — table implicite Prisma
 * "_CategoryToCircuit" : "A" → categories.id, "B" → circuits.id,
 * PK (A, B), ON DELETE CASCADE des deux côtés (supprimer un circuit
 * ou une catégorie purge les paires, comme Prisma).
 *
 * include:{categories:true} sérialise un tableau de 0..n objets :
 * remplissage par requête groupée (une seule par page — jamais de
 * N+1 contre la base Aiven distante).
 */
final class Circuits
{
    private const JOIN = '"_CategoryToCircuit"';

    /**
     * Lignes circuits (colonnes d_ de la destination jointe) → items
     * sérialisés avec destination + categories: [...].
     */
    public static function attach(array $rows): array
    {
        $ids = array_values(array_unique(array_column($rows, 'id')));
        $byCircuit = $ids === [] ? [] : self::categoriesByCircuit($ids);
        $items = [];
        foreach ($rows as $row) {
            $circuit = Serial::circuit($row, true);
            $circuit['categories'] = $byCircuit[$row['id']] ?? [];
            $items[] = $circuit;
        }
        return $items;
    }

    /** Variante single-row de attach(). */
    public static function attachOne(array $row): array
    {
        return self::attach([$row])[0];
    }

    /**
     * POST circuits — body.categoryIds non vide → « connect »
     * (categories: { connect: [...] } côté Prisma).
     */
    public static function connectFromData(string $circuitId, array $data): void
    {
        $ids = $data['categoryIds'] ?? null;
        if (is_array($ids) && $ids !== []) {
            self::insertPairs($circuitId, $ids);
        }
    }

    /**
     * PATCH circuits — body.categoryIds présent → « set » : remplace toutes
     * les paires (tableau vide = retire tout), comme la route Next. null est
     * accepté et retire tout (divergence documentée : la route Next lève
     * 500 sur null).
     */
    public static function setFromData(string $circuitId, array $data): void
    {
        if (!array_key_exists('categoryIds', $data)) {
            return;
        }
        Db::run('DELETE FROM ' . self::JOIN . ' WHERE "B" = ?', [$circuitId]);
        $ids = $data['categoryIds'];
        if (is_array($ids)) {
            self::insertPairs($circuitId, $ids);
        }
    }

    /**
     * Insère les paires (catégorie, circuit). Ids inexistants → 404
     * « Ressource introuvable » (P2025 du connect Prisma) ; les doublons
     * sont ignorés (Prisma les rejette → 500 côté Next).
     */
    private static function insertPairs(string $circuitId, array $categoryIds): void
    {
        $ids = array_values(array_unique($categoryIds));
        if ($ids === []) {
            return;
        }
        $placeholders = implode(', ', array_fill(0, count($ids), '?'));
        $found = (int) Db::val(
            'SELECT COUNT(*) FROM categories WHERE id IN (' . $placeholders . ')',
            $ids
        );
        if ($found !== count($ids)) {
            Http::notFound(); // P2025 : connect sur un id inexistant
        }
        $values = [];
        $params = [];
        foreach ($ids as $categoryId) {
            $values[] = '(?, ?)';
            $params[] = $categoryId;
            $params[] = $circuitId;
        }
        Db::run('INSERT INTO ' . self::JOIN . ' ("A", "B") VALUES ' . implode(', ', $values), $params);
    }

    /** @return array<string, array<int, array>> catégories sérialisées, par id de circuit */
    private static function categoriesByCircuit(array $circuitIds): array
    {
        $placeholders = implode(', ', array_fill(0, count($circuitIds), '?'));
        $rows = Db::all(
            'SELECT j."B" AS circuit_id, ' . Model::prefixed(Model::CATEGORY, 'k', 'k_')
            . ' FROM ' . self::JOIN . ' j'
            . ' JOIN categories k ON k.id = j."A"'
            . ' WHERE j."B" IN (' . $placeholders . ')'
            . ' ORDER BY k.sort_order ASC, k.name ASC',
            $circuitIds
        );
        $byCircuit = [];
        foreach ($rows as $row) {
            $byCircuit[$row['circuit_id']][] = Serial::nested($row, 'k_', Model::CATEGORY);
        }
        return $byCircuit;
    }
}
