<?php

declare(strict_types=1);

namespace WT;

/**
 * Port de lib/api/schemas.ts : chaque méthode valide un schéma via
 * Validator et retourne les données validées (défauts appliqués).
 * L'appelant déclenche $v->fail() → 400 {error, details}.
 *
 * Les variantes *Update reproduisent partialWithoutDefaults : champs
 * optionnels, aucun défaut réappliqué (PATCH partiel).
 */
final class Schemas
{
    /**
     * Champs communs circuit hors title/price/currency — requis ou avec
     * défaut en create, rendus optionnels par partialWithoutDefaults en
     * update (les défauts ne sont jamais réappliqués en PATCH).
     */
    private static function circuitCommon(Validator $v): void
    {
        $v->optStr('titleEn', 255);
        $v->optStr('subtitle', 2000);
        $v->optStr('subtitleEn', 2000);
        $v->optStr('description', 10000);
        $v->optStr('descriptionEn', 10000);
        $v->optUuid('destinationId');
        // Relation m-n : ids des catégories (connect/set côté Prisma).
        $v->optUuidList('categoryIds', 10);
        $v->optNum('durationDays', 1, 365, int: true);
        $v->optNum('durationNights', 0, 364, int: true);
        $v->optStr('imageUrl', 500);
        $v->optStrList('gallery', 1, 500);
        $v->optStrList('highlights', 1, 500);
        $v->optItinerary('itinerary');
        $v->optStrList('included', 1, 500);
        $v->optStrList('excluded', 1, 500);
        $v->enum('difficulty', ['easy', 'moderate', 'challenging']);
        $v->optNum('minParticipants', 1, 1000, int: true);
        $v->optNum('maxParticipants', 1, 1000, int: true);
    }

    public static function circuitCreate(Validator $v): array
    {
        $v->str('title', 3, 255);
        self::circuitCommon($v);
        $v->reqNum('price', 0, null);
        // length(3) non nullable, défaut XOF : null explicite → 400, comme zod.
        $v->optStr('currency', 3, 3, 'XOF', nullable: false);
        $v->bool('isFeatured', false);
        $v->bool('isActive', true);

        return $v->d();
    }

    public static function circuitUpdate(Validator $v): array
    {
        // partialWithoutDefaults : tout optionnel ; title/price non nullables
        // (null → 400 comme zod) ; aucun défaut réappliqué.
        $v->optStr('title', 255, 3, nullable: false);
        self::circuitCommon($v);
        $v->optNum('price', 0, null, nullable: false);
        $v->optStr('currency', 3, 3, nullable: false);
        $v->optBool('isFeatured');
        $v->optBool('isActive');

        return $v->d();
    }

    // ─────────────────────────────── Destinations ───────────────────────────────

    public static function destinationCreate(Validator $v): array
    {
        $v->str('name', 2, 100);
        $v->optStr('nameEn', 100);
        $v->optStr('description', 10000);
        $v->optStr('descriptionEn', 10000);
        $v->optStr('imageUrl', 500);
        $v->optStr('country', 100);
        $v->optStr('region', 100);
        $v->bool('isActive', true);

        return $v->d();
    }

    public static function destinationUpdate(Validator $v): array
    {
        $v->optStr('name', 100, 2, nullable: false);
        $v->optStr('nameEn', 100);
        $v->optStr('description', 10000);
        $v->optStr('descriptionEn', 10000);
        $v->optStr('imageUrl', 500);
        $v->optStr('country', 100);
        $v->optStr('region', 100);
        $v->optBool('isActive');

        return $v->d();
    }

    // ─────────────────────────────── Catégories ───────────────────────────────

    public static function categoryCreate(Validator $v): array
    {
        $v->str('name', 2, 100);
        $v->optStr('nameEn', 100);
        $v->optStr('description', 10000);
        $v->optStr('descriptionEn', 10000);
        $v->optStr('icon', 50);
        $v->optHexColor('color');
        $v->optNum('sortOrder', 0, null, int: true, nullable: false, default: 0);
        $v->bool('isActive', true);

        return $v->d();
    }

    public static function categoryUpdate(Validator $v): array
    {
        $v->optStr('name', 100, 2, nullable: false);
        $v->optStr('nameEn', 100);
        $v->optStr('description', 10000);
        $v->optStr('descriptionEn', 10000);
        $v->optStr('icon', 50);
        $v->optHexColor('color');
        $v->optNum('sortOrder', 0, null, int: true, nullable: false);
        $v->optBool('isActive');

        return $v->d();
    }

    // ─────────────────────────────── Témoignages ───────────────────────────────

    public static function testimonialCreate(Validator $v): array
    {
        $v->str('name', 2, 100);
        $v->optStr('country', 100);
        $v->reqInt('rating', 1, 5);
        $v->str('text', 10, 5000);
        $v->optStr('textEn', 5000);
        $v->optUuid('circuitId');
        $v->optStr('avatarUrl', 500);
        $v->optDateOrEmpty('date');
        $v->bool('isVerified', false);
        $v->bool('isFeatured', false);
        $v->bool('isActive', true);

        return $v->d();
    }

    public static function testimonialUpdate(Validator $v): array
    {
        $v->optStr('name', 100, 2, nullable: false);
        $v->optStr('country', 100);
        $v->optNum('rating', 1, 5, int: true, nullable: false);
        $v->optStr('text', 5000, 10, nullable: false);
        $v->optStr('textEn', 5000);
        $v->optUuid('circuitId');
        $v->optStr('avatarUrl', 500);
        $v->optDateOrEmpty('date');
        $v->optBool('isVerified');
        $v->optBool('isFeatured');
        $v->optBool('isActive');

        return $v->d();
    }

    // ─────────────────────────────── Services ───────────────────────────────

    public static function serviceCreate(Validator $v): array
    {
        $v->str('title', 2, 255);
        $v->optStr('titleEn', 255);
        $v->optStr('description', 10000);
        $v->optStr('descriptionEn', 10000);
        $v->optStr('icon', 50);
        $v->optStr('href', 255);
        $v->optNum('sortOrder', 0, null, int: true, nullable: false, default: 0);
        $v->bool('isActive', true);

        return $v->d();
    }

    public static function serviceUpdate(Validator $v): array
    {
        $v->optStr('title', 255, 2, nullable: false);
        $v->optStr('titleEn', 255);
        $v->optStr('description', 10000);
        $v->optStr('descriptionEn', 10000);
        $v->optStr('icon', 50);
        $v->optStr('href', 255);
        $v->optNum('sortOrder', 0, null, int: true, nullable: false);
        $v->optBool('isActive');

        return $v->d();
    }

    // ─────────────────────────────── Articles de blog ───────────────────────────────

    public static function blogPostCreate(Validator $v): array
    {
        $v->str('title', 3, 255);
        $v->optStr('titleEn', 255);
        $v->optStr('excerpt', 2000);
        $v->optStr('excerptEn', 2000);
        $v->optStr('content', 100000, 10);
        $v->optStr('contentEn', 100000);
        $v->optUuid('categoryId');
        $v->optStr('imageUrl', 500);
        $v->optStrList('tags', 1, 50);
        $v->optNum('readTime', 1, 600, int: true, nullable: false);
        $v->bool('isFeatured', false);
        $v->bool('isPublished', false);

        return $v->d();
    }

    public static function blogPostUpdate(Validator $v): array
    {
        $v->optStr('title', 255, 3, nullable: false);
        $v->optStr('titleEn', 255);
        $v->optStr('excerpt', 2000);
        $v->optStr('excerptEn', 2000);
        $v->optStr('content', 100000, 10);
        $v->optStr('contentEn', 100000);
        $v->optUuid('categoryId');
        $v->optStr('imageUrl', 500);
        $v->optStrList('tags', 1, 50);
        $v->optNum('readTime', 1, 600, int: true, nullable: false);
        $v->optBool('isFeatured');
        $v->optBool('isPublished');

        return $v->d();
    }

    // ─────────────────────────────── Catégories blog ───────────────────────────────

    public static function blogCategoryCreate(Validator $v): array
    {
        $v->str('name', 2, 100);
        $v->optStr('nameEn', 100);
        $v->optStr('description', 10000);
        $v->optHexColor('color');
        $v->optNum('sortOrder', 0, null, int: true, nullable: false, default: 0);
        $v->bool('isActive', true);

        return $v->d();
    }

    public static function blogCategoryUpdate(Validator $v): array
    {
        $v->optStr('name', 100, 2, nullable: false);
        $v->optStr('nameEn', 100);
        $v->optStr('description', 10000);
        $v->optHexColor('color');
        $v->optNum('sortOrder', 0, null, int: true, nullable: false);
        $v->optBool('isActive');

        return $v->d();
    }

    // ─────────────────────────────── Paramètres (PUT settings) ───────────────────────────────

    /**
     * PUT /api/dashboard/settings — {settings: [1..100 × {key, value, description?}]}.
     * Retourne les entrées validées dans l'ordre d'entrée, avec le marqueur
     * hasDescription (Prisma n'écrit description que si fournie : !== undefined).
     *
     * @return array<int, array{key: string, value: ?string, description?: ?string, hasDescription: bool}>
     */
    public static function settingsPut(Validator $v): array
    {
        $items = $v->raw()['settings'] ?? null;
        if (!is_array($items)) {
            $v->custom(['settings'], $items === null ? 'Champ requis' : 'Liste attendue', 'invalid_type');
            return [];
        }
        $count = count($items);
        if ($count === 0) {
            $v->custom(['settings'], 'Doit contenir au moins 1 élément(s)', 'too_small');
            return [];
        }
        if ($count > 100) {
            $v->custom(['settings'], 'Doit contenir au plus 100 éléments', 'too_big');
            return [];
        }

        $out = [];
        foreach (array_values($items) as $index => $item) {
            if (!is_array($item)) {
                $v->custom(['settings', $index], 'Objet attendu', 'invalid_type');
                return [];
            }
            $key = $item['key'] ?? null;
            if (!is_string($key)) {
                $v->custom(['settings', $index, 'key'], $key === null ? 'Champ requis' : 'Chaîne attendue', 'invalid_type');
                return [];
            }
            $key = trim($key);
            if ($key === '' || mb_strlen($key) > 100) {
                $v->custom(['settings', $index, 'key'], 'Doit contenir entre 1 et 100 caractères', 'too_small');
                return [];
            }
            if (!array_key_exists('value', $item)) {
                $v->custom(['settings', $index, 'value'], 'Champ requis', 'invalid_type');
                return [];
            }
            $value = $item['value'];
            if ($value !== null && !is_string($value)) {
                $v->custom(['settings', $index, 'value'], 'Chaîne attendue', 'invalid_type');
                return [];
            }
            if (is_string($value) && mb_strlen($value) > 10000) {
                $v->custom(['settings', $index, 'value'], 'Doit contenir au plus 10000 caractères', 'too_big');
                return [];
            }
            $entry = ['key' => $key, 'value' => $value, 'hasDescription' => array_key_exists('description', $item)];
            if ($entry['hasDescription']) {
                $description = $item['description'];
                if ($description !== null && !is_string($description)) {
                    $v->custom(['settings', $index, 'description'], 'Chaîne attendue', 'invalid_type');
                    return [];
                }
                if (is_string($description) && mb_strlen($description) > 1000) {
                    $v->custom(['settings', $index, 'description'], 'Doit contenir au plus 1000 caractères', 'too_big');
                    return [];
                }
                $entry['description'] = $description;
            }
            $out[] = $entry;
        }
        return $out;
    }
}
