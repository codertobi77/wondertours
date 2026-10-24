<?php

declare(strict_types=1);

namespace WT;

/**
 * Port de lib/slug.ts — slugify + uniqueSlug.
 *
 * slugify : l'original TS utilise normalize("NFD") + suppression des
 * signes diacritiques (U+0300-U+036F). L'extension intl n'étant pas
 * disponible sur LWS Perso, la décomposition est remplacée par une table
 * de translittération couvrant Latin-1 + Latin Extended-A (contenu FR/EN) ;
 * les signes combinants déjà présents dans l'entrée sont retirés.
 * Les caractères sans décomposition canonique (æ, œ, ø, đ, ł, ß…) deviennent
 * « - », exactement comme côté Next.
 */
final class Slug
{
    /**
     * Base ASCII pour chaque caractère accentué décomposable (formes
     * minuscules — l'entrée est passée en minuscules Unicode avant).
     * Public : réutilisé par Media::safeName (noms de fichiers téléversés).
     */
    public const TRANSLIT = [
        'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a',
        'ā' => 'a', 'ă' => 'a', 'ą' => 'a',
        'ç' => 'c', 'ć' => 'c', 'ĉ' => 'c', 'ċ' => 'c', 'č' => 'c',
        'ď' => 'd',
        'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
        'ē' => 'e', 'ĕ' => 'e', 'ė' => 'e', 'ę' => 'e', 'ě' => 'e',
        'ĝ' => 'g', 'ğ' => 'g', 'ġ' => 'g', 'ģ' => 'g',
        'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
        'ĩ' => 'i', 'ī' => 'i', 'ĭ' => 'i', 'į' => 'i',
        'ĵ' => 'j', 'ķ' => 'k',
        'ĺ' => 'l', 'ļ' => 'l', 'ľ' => 'l', 'ŀ' => 'l',
        'ñ' => 'n', 'ń' => 'n', 'ņ' => 'n', 'ň' => 'n',
        'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
        'ō' => 'o', 'ŏ' => 'o', 'ő' => 'o',
        'ŕ' => 'r', 'ŗ' => 'r', 'ř' => 'r',
        'ś' => 's', 'ŝ' => 's', 'ş' => 's', 'š' => 's',
        'ţ' => 't', 'ť' => 't',
        'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
        'ũ' => 'u', 'ū' => 'u', 'ŭ' => 'u', 'ů' => 'u', 'ű' => 'u', 'ų' => 'u',
        'ŵ' => 'w',
        'ý' => 'y', 'ÿ' => 'y', 'ŷ' => 'y',
        'ź' => 'z', 'ż' => 'z', 'ž' => 'z',
    ];

    /** Tables de slug → table SQL (noms @@map de prisma/schema.prisma). */
    private const TABLES = [
        'circuit' => 'circuits',
        'destination' => 'destinations',
        'category' => 'categories',
        'blogPost' => 'blog_posts',
        'blogCategory' => 'blog_categories',
    ];

    /** Convertit un titre en slug URL (ASCII, minuscules, tirets). */
    public static function slugify(string $input): string
    {
        $slug = mb_strtolower($input);
        $slug = preg_replace('/[\x{0300}-\x{036F}]/u', '', $slug) ?? '';
        $slug = strtr($slug, self::TRANSLIT);
        $slug = strtr($slug, ["'" => '', '’' => '']);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');

        return mb_substr($slug, 0, 200);
    }

    /**
     * Génère un slug unique : suffixe numérique (-2, -3…) si le slug de
     * base existe déjà pour la table donnée. $excludeId ignore la ligne
     * courante (PATCH).
     */
    public static function uniqueSlug(string $table, string $title, ?string $excludeId = null): string
    {
        $sqlTable = self::TABLES[$table] ?? null;
        if ($sqlTable === null) {
            throw new \RuntimeException("Table de slug inconnue : $table");
        }

        $base = self::slugify($title);
        if ($base === '') {
            throw new \RuntimeException("Impossible de générer un slug à partir d'un titre vide");
        }

        $exists = function (string $slug) use ($sqlTable, $excludeId): bool {
            if ($excludeId !== null) {
                $row = Db::one(
                    "SELECT id FROM $sqlTable WHERE slug = ? AND id <> ? LIMIT 1",
                    [$slug, $excludeId]
                );
            } else {
                $row = Db::one("SELECT id FROM $sqlTable WHERE slug = ? LIMIT 1", [$slug]);
            }
            return $row !== null;
        };

        $slug = $base;
        $suffix = 2;
        while ($exists($slug)) {
            $slug = $base . '-' . $suffix++;
        }
        return $slug;
    }
}
