<?php

declare(strict_types=1);

namespace WT;

/**
 * Sérialisation ligne SQL → JSON « à la Prisma » :
 *   - timestamptz  → "2026-10-20T08:56:45.123Z" (Date.toJSON) ;
 *   - @db.Date     → "2026-12-15T00:00:00.000Z" (minuit UTC) ;
 *   - Decimal      → chaîne sans zéros traînants ("45000.00" → "45000") ;
 *   - booléens PG  → 't'/'f' → true/false ;
 *   - BigInt (size) → chaîne (stringify BigInt du contrat API).
 *
 * Les cartes de colonnes vivent dans Model (source de vérité partagée avec
 * les SELECT préfixés des jointures).
 */
final class Serial
{
    // ─────────────────────────────── Formats ───────────────────────────────

    /** timestamptz PostgreSQL → ISO 8601 UTC, millisecondes (Date.toJSON). */
    public static function ts(?string $pg): ?string
    {
        if ($pg === null) {
            return null;
        }
        if (!preg_match('/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}(?::?\d{2})?)?$/', $pg, $m)) {
            return $pg; // format inattendu : rendu tel quel
        }
        $offset = $m[4] ?? '';
        if ($offset === '' || $offset === 'Z' || $offset === '+00' || $offset === '+0000' || $offset === '+00:00') {
            // Session UTC : simple re-formatage (rapide).
            $ms = substr(str_pad($m[3] ?? '', 3, '0'), 0, 3);
            return "{$m[1]}T{$m[2]}.{$ms}Z";
        }
        $withColons = str_contains($offset, ':') ? $offset : substr($offset, 0, 3) . ':' . substr($offset . '00', 3, 2);
        $dt = \DateTimeImmutable::createFromFormat(
            'Y-m-d H:i:s.uP',
            "{$m[1]} {$m[2]}." . str_pad($m[3] ?? '', 6, '0') . ' ' . $withColons
        );
        return $dt === false ? $pg : $dt->format('Y-m-d\TH:i:s.v\Z');
    }

    /** Colonne date (@db.Date) → minuit UTC, comme DateTime Prisma. */
    public static function pgDate(?string $pg): ?string
    {
        if ($pg === null) {
            return null;
        }
        if (preg_match('/^(\d{4}-\d{2}-\d{2})$/', $pg, $m)) {
            return "{$m[1]}T00:00:00.000Z";
        }
        return self::ts($pg);
    }

    /** numeric → chaîne décimale sans zéros traînants (Decimal.toJSON). */
    public static function dec(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }
        $s = (string) $value;
        if (!str_contains($s, '.')) {
            return $s;
        }
        [$int, $frac] = explode('.', $s, 2);
        $frac = rtrim($frac, '0');
        return $frac === '' ? $int : "$int.$frac";
    }

    /** Colonne Json → valeur PHP (recodée à l'encodage JSON final). */
    public static function j(mixed $raw): mixed
    {
        if ($raw === null || $raw === '' || !is_string($raw)) {
            return $raw;
        }
        return json_decode($raw, true);
    }

    private static function bool(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }
        return $value === 't' || $value === true || $value === 1 || $value === '1';
    }

    // ─────────────────────────────── Application des cartes ───────────────────────────────

    private static function transform(mixed $value, string $type): mixed
    {
        return match ($type) {
            'bool' => self::bool($value),
            'int' => $value === null ? null : (int) $value,
            'ts' => self::ts($value === null ? null : (string) $value),
            'date' => self::pgDate($value === null ? null : (string) $value),
            'dec' => self::dec($value),
            'json' => self::j($value),
            'str' => $value === null ? null : (string) $value,
            default => $value,
        };
    }

    /** Ligne (colonnes de la table principale) → tableau camelCase typé. */
    public static function remap(array $row, array $map): array
    {
        $out = [];
        foreach ($map as $column => $spec) {
            if (is_string($spec)) {
                $out[$spec] = $row[$column] ?? null;
            } else {
                [$key, $type] = $spec;
                $out[$key] = self::transform($row[$column] ?? null, $type);
            }
        }
        return $out;
    }

    /**
     * Relation jointe préfixée (clés "p_id", "p_name"…) → objet imbriqué
     * ou null — publique : aussi utilisée pour les catégories m-n des
     * circuits (WT\Circuits).
     */
    public static function nested(array $row, string $prefix, array $map): ?array
    {
        if (!array_key_exists($prefix . 'id', $row) || $row[$prefix . 'id'] === null) {
            return null;
        }
        return self::remap($row, array_combine(
            array_map(fn (string $column): string => $prefix . $column, array_keys($map)),
            array_map(
                fn ($spec): array|string => is_string($spec) ? $spec : [$spec[0], $spec[1]],
                array_values($map)
            )
        ));
    }

    // ─────────────────────────────── Sérialiseurs ───────────────────────────────

    /** Circuit — relation destination (d_) si présente ; catégories m-n via Circuits::attach. */
    public static function circuit(array $row, bool $withRelations = true): array
    {
        $out = self::remap($row, Model::CIRCUIT);
        if ($withRelations && array_key_exists('d_id', $row)) {
            $out['destination'] = self::nested($row, 'd_', Model::DESTINATION);
        }
        return $out;
    }

    /** Article — relations category (bc_) + author (a_, sans password_hash). */
    public static function blogPost(array $row, bool $withRelations = true): array
    {
        $out = self::remap($row, Model::BLOG_POST);
        if ($withRelations && array_key_exists('bc_id', $row)) {
            $out['category'] = self::nested($row, 'bc_', Model::BLOG_CATEGORY);
            $out['author'] = self::nested($row, 'a_', Model::USER);
        }
        return $out;
    }

    /**
     * Réservation — circuit lié (c_) si présent.
     * $circuitColumns ['id','title','slug'] (liste dashboard) ou ['title','slug'] (stats récentes).
     */
    public static function booking(array $row, array $circuitColumns = ['id', 'title', 'slug']): array
    {
        $out = self::remap($row, Model::BOOKING);
        if (array_key_exists('c_id', $row)) {
            $out['circuit'] = null;
            if ($row['c_id'] !== null) {
                $circuit = [];
                foreach ($circuitColumns as $column) {
                    $circuit[$column] = $row['c_' . $column] ?? null;
                }
                $out['circuit'] = $circuit;
            }
        }
        return $out;
    }

    public static function destination(array $row): array
    {
        return self::remap($row, Model::DESTINATION);
    }

    public static function category(array $row): array
    {
        return self::remap($row, Model::CATEGORY);
    }

    public static function blogCategory(array $row): array
    {
        return self::remap($row, Model::BLOG_CATEGORY);
    }

    public static function testimonial(array $row): array
    {
        return self::remap($row, Model::TESTIMONIAL);
    }

    public static function service(array $row): array
    {
        return self::remap($row, Model::SERVICE);
    }

    public static function contactRequest(array $row): array
    {
        return self::remap($row, Model::CONTACT_REQUEST);
    }

    public static function setting(array $row): array
    {
        return self::remap($row, Model::SETTING);
    }

    public static function mediaFile(array $row): array
    {
        return self::remap($row, Model::MEDIA_FILE);
    }

    /** Utilisateur public — password_hash jamais inclus. */
    public static function publicUser(array $row): array
    {
        return self::remap($row, Model::USER);
    }

    /** Enveloppe liste paginée du contrat : {items, total, page, pageSize}. */
    public static function list(array $items, int $total, int $page, int $pageSize): array
    {
        return ['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize];
    }
}
