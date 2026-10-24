<?php

declare(strict_types=1);

namespace WT;

/**
 * Port de lib/api/schemas.ts + schémas locaux des routes (zod) :
 *   - required/optional/nullable avec les mêmes bornes ;
 *   - z.coerce.number()/int()/boolean() : chaînes numériques acceptées,
 *     booléens convertis avec la sémantique JS Boolean() ;
 *   - PATCH = « partial sans defaults » : seuls les champs fournis sont
 *     validés puis modifiés (partialWithoutDefaults) ;
 *   - échecs → 400 {error, details:[{code, path, message}]} (zod issues).
 */
final class Validator
{
    private array $issues = [];
    private array $data = [];

    private function __construct(
        private readonly array $input,
        private readonly string $errorMessage
    ) {
    }

    /** Corps JSON de la requête — 400 « Corps JSON invalide » si illisible. */
    public static function body(): self
    {
        $body = Http::jsonBody();
        if ($body === null) {
            Http::badRequest('Corps JSON invalide');
        }
        return new self($body, 'Données invalides');
    }

    /** Query params — échecs → 400 « Paramètres invalides ». */
    public static function query(): self
    {
        return new self(Http::query(), 'Paramètres invalides');
    }

    // ─────────────────────────────── Primitives ───────────────────────────────

    private function issue(string $path, string $code, string $message): void
    {
        $this->issues[] = ['code' => $code, 'path' => [$path], 'message' => $message];
    }

    /**
     * Erreur manuelle (équivalent .refine() zod) — path relatif à la racine
     * du corps ([] pour une erreur au niveau racine).
     * @param array<int, string|int> $path
     */
    public function custom(array $path, string $message, string $code = 'custom'): void
    {
        $this->issues[] = ['code' => $code, 'path' => $path, 'message' => $message];
    }

    private function present(string $key): bool
    {
        return array_key_exists($key, $this->input);
    }

    public function ok(): bool
    {
        return $this->issues === [];
    }

    /**
     * Si des erreurs existent : 400 {error, details} et fin de requête
     * (Http::badRequest ne retourne pas). Sans erreur : retour simple —
     * la requête continue avec les données validées (d()).
     */
    public function fail(): void
    {
        if ($this->issues !== []) {
            Http::badRequest($this->errorMessage, $this->issues);
        }
    }

    /** Données validées (avec défauts appliqués) — à appeler après fail(). */
    public function d(): array
    {
        return $this->data;
    }

    /** Corps/query brut — accès aux structures imbriquées (settings, translate). */
    public function raw(): array
    {
        return $this->input;
    }

    private static function trim(string $value): string
    {
        return preg_replace('/^[\p{White_Space}]+|[\p{White_Space}]+$/u', '', $value) ?? trim($value);
    }

    // ─────────────────────────────── Chaînes ───────────────────────────────

    /** Chaîne requise, trim, longueur min..max. */
    public function str(string $key, int $min, int $max): void
    {
        $value = $this->input[$key] ?? null;
        if (!is_string($value)) {
            $this->issue($key, 'invalid_type', $value === null ? 'Champ requis' : 'Chaîne attendue');
            return;
        }
        $value = self::trim($value);
        $len = mb_strlen($value);
        if ($len < $min || $len > $max) {
            $this->issue($key, 'too_small', "Doit contenir entre $min et $max caractères");
            return;
        }
        $this->data[$key] = $value;
    }

    /**
     * Chaîne optionnelle/nullable, trim, max (min par défaut 0).
     * $default appliqué si absente (z .default()), $nullable si null explicite.
     */
    public function optStr(string $key, int $max, int $min = 0, ?string $default = null, bool $nullable = true): void
    {
        if (!$this->present($key)) {
            if ($default !== null) {
                $this->data[$key] = $default;
            }
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            if ($nullable) {
                $this->data[$key] = null;
            } else {
                $this->issue($key, 'invalid_type', 'Chaîne attendue');
            }
            return;
        }
        if (!is_string($value)) {
            $this->issue($key, 'invalid_type', 'Chaîne attendue');
            return;
        }
        $value = self::trim($value);
        $len = mb_strlen($value);
        if ($len < $min || $len > $max) {
            $this->issue($key, 'too_small', "Doit contenir entre $min et $max caractères");
            return;
        }
        $this->data[$key] = $value;
    }

    // ─────────────────────────────── Nombres (z.coerce) ───────────────────────────────

    /** Nombre requis, coerce, bornes min/max. */
    public function reqNum(string $key, float $min, ?float $max): void
    {
        $this->num($key, $min, $max, required: true, int: false, nullable: false, default: null);
    }

    /** Nombre requis entier (z.coerce.number().int()). */
    public function reqInt(string $key, int $min, ?int $max): void
    {
        $this->num($key, (float) $min, $max === null ? null : (float) $max, required: true, int: true, nullable: false, default: null);
    }

    /**
     * Nombre optionnel (coerce) — nullable par défaut, défaut possible.
     * $int : rejette les non-entiers (z.int()).
     */
    public function optNum(
        string $key,
        ?float $min,
        ?float $max,
        bool $int = false,
        bool $nullable = true,
        int|float|null $default = null
    ): void {
        $this->num($key, $min, $max, required: false, int: $int, nullable: $nullable, default: $default);
    }

    private function num(string $key, ?float $min, ?float $max, bool $required, bool $int, bool $nullable, int|float|null $default): void
    {
        if (!$this->present($key)) {
            if ($required) {
                $this->issue($key, 'invalid_type', 'Champ requis');
            } elseif ($default !== null) {
                $this->data[$key] = $default;
            }
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            if ($nullable) {
                $this->data[$key] = null;
            } else {
                $this->issue($key, 'invalid_type', 'Nombre attendu');
            }
            return;
        }
        if (is_bool($value) || !is_numeric($value)) {
            $this->issue($key, 'invalid_type', 'Nombre attendu');
            return;
        }
        // Normaliser en float avant floor() : floor(2) renvoie 2.0 (float),
        // et 2.0 !== 2 en comparaison stricte PHP 8.
        $number = (float) $value;
        if ($int && floor($number) !== $number) {
            $this->issue($key, 'invalid_type', 'Nombre entier attendu');
            return;
        }
        if ($min !== null && $number < $min) {
            $this->issue($key, 'too_small', "Doit être ≥ $min");
            return;
        }
        if ($max !== null && $number > $max) {
            $this->issue($key, 'too_big', "Doit être ≤ $max");
            return;
        }
        $this->data[$key] = $int ? (int) $number : $number;
    }

    // ─────────────────────────────── Booléens (z.coerce.boolean) ───────────────────────────────

    /** Sémantique JS Boolean() : false, 0, '', null → false ; tout le reste → true. */
    private static function jsBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if ($value === null) {
            return false;
        }
        if (is_int($value) || is_float($value)) {
            return $value !== 0 && $value !== 0.0;
        }
        if (is_string($value)) {
            return $value !== '';
        }
        return true;
    }

    /** Booléen avec défaut (schémas de création : isFeatured etc.). */
    public function bool(string $key, bool $default): void
    {
        if (!$this->present($key)) {
            $this->data[$key] = $default;
            return;
        }
        $this->data[$key] = self::jsBool($this->input[$key]);
    }

    /** Booléen optionnel sans défaut (PATCH — partialWithoutDefaults). */
    public function optBool(string $key): void
    {
        if ($this->present($key)) {
            $this->data[$key] = self::jsBool($this->input[$key]);
        }
    }

    // ─────────────────────────────── Énumérations ───────────────────────────────

    /** Énum requise, avec défaut éventuel. $nullable=false : null rejeté. */
    public function enum(string $key, array $values, ?string $default = null, bool $nullable = true): void
    {
        if (!$this->present($key)) {
            if ($default !== null) {
                $this->data[$key] = $default;
            }
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            if ($nullable) {
                $this->data[$key] = null;
            } else {
                $this->issue($key, 'invalid_type', 'Valeur attendue');
            }
            return;
        }
        if (!is_string($value) || !in_array($value, $values, true)) {
            $this->issue($key, 'invalid_enum_value', 'Valeur non autorisée');
            return;
        }
        $this->data[$key] = $value;
    }

    /**
     * Énum requise non nullable (z.enum) : absente → « Champ requis »,
     * null → « Valeur attendue », hors valeurs → invalid_enum_value.
     * (status des PATCH dashboard, targetLocale du translate.)
     */
    public function reqEnum(string $key, array $values): void
    {
        if (!$this->present($key)) {
            $this->issue($key, 'invalid_type', 'Champ requis');
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            $this->issue($key, 'invalid_type', 'Valeur attendue');
            return;
        }
        if (!is_string($value) || !in_array($value, $values, true)) {
            $this->issue($key, 'invalid_enum_value', 'Valeur non autorisée');
            return;
        }
        $this->data[$key] = $value;
    }

    // ─────────────────────── UUID / email / token ───────────────────────

    private const UUID_REGEX = '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/';

    /**
     * UUID optionnel (z.string().uuid().optional().nullable()) —
     * $nullable=false pour .optional() strict (null → 400, ex. circuitId
     * des réservations publiques).
     */
    public function optUuid(string $key, bool $nullable = true): void
    {
        if (!$this->present($key)) {
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            if ($nullable) {
                $this->data[$key] = null;
            } else {
                $this->issue($key, 'invalid_type', 'UUID attendu');
            }
            return;
        }
        if (!is_string($value) || preg_match(self::UUID_REGEX, $value) !== 1) {
            $this->issue($key, 'invalid_string', 'UUID invalide');
            return;
        }
        $this->data[$key] = $value;
    }

    /**
     * Liste d'UUID optionnelle nullable (categoryIds, relation m-n) —
     * z.array(z.string().uuid()).max(10).optional().nullable().
     */
    public function optUuidList(string $key, int $max): void
    {
        if (!$this->present($key)) {
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            $this->data[$key] = null;
            return;
        }
        if (!is_array($value)) {
            $this->issue($key, 'invalid_type', 'Liste attendue');
            return;
        }
        if (count($value) > $max) {
            $this->issue($key, 'too_big', "Doit contenir au plus $max éléments");
            return;
        }
        $items = [];
        foreach (array_values($value) as $index => $item) {
            if (!is_string($item) || preg_match(self::UUID_REGEX, $item) !== 1) {
                $this->issue("$key.$index", 'invalid_string', 'UUID invalide');
                return;
            }
            $items[] = $item;
        }
        $this->data[$key] = $items;
    }

    /** Email — trim (+ lowercase éventuel), max (null = illimité, ex. login), requis ou optionnel. */
    public function email(string $key, bool $required, bool $lowercase = false, ?int $max = 255, bool $nullable = false): void
    {
        if (!$this->present($key)) {
            if ($required) {
                $this->issue($key, 'invalid_type', 'Champ requis');
            }
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            if ($nullable) {
                $this->data[$key] = null;
            } else {
                $this->issue($key, 'invalid_type', 'Email attendu');
            }
            return;
        }
        if (!is_string($value)) {
            $this->issue($key, 'invalid_type', 'Email attendu');
            return;
        }
        $value = self::trim($value);
        if ($lowercase) {
            $value = mb_strtolower($value);
        }
        if ($value === '' || ($max !== null && mb_strlen($value) > $max) || filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            $this->issue($key, 'invalid_string', 'Email invalide');
            return;
        }
        $this->data[$key] = $value;
    }

    /** Mot de passe requis : min..max caractères. */
    public function password(string $key, int $min, int $max): void
    {
        $value = $this->input[$key] ?? null;
        if (!is_string($value)) {
            $this->issue($key, 'invalid_type', $value === null ? 'Champ requis' : 'Chaîne attendue');
            return;
        }
        $len = mb_strlen($value);
        if ($len < $min || $len > $max) {
            $this->issue($key, 'too_small', "Doit contenir entre $min et $max caractères");
            return;
        }
        $this->data[$key] = $value;
    }

    /** Mot de passe optionnel, SANS trim (z.string().min().max().optional()). */
    public function optPassword(string $key, int $min, int $max): void
    {
        if (!$this->present($key)) {
            return;
        }
        $value = $this->input[$key];
        if (!is_string($value)) {
            $this->issue($key, 'invalid_type', 'Chaîne attendue');
            return;
        }
        $len = mb_strlen($value);
        if ($len < $min || $len > $max) {
            $this->issue($key, 'too_small', "Doit contenir entre $min et $max caractères");
            return;
        }
        $this->data[$key] = $value;
    }

    /**
     * Token de réinitialisation : trim + 64 caractères hexadécimaux
     * (regex insensible à la casse, comme /^[0-9a-f]{64}$/i côté Next).
     * PAS de minuscule forcée : le hash SHA-256 porte sur le token brut —
     * une variante en majuscules doit échouer au lookup, comme côté Next.
     */
    public function token64(string $key): void
    {
        $value = $this->input[$key] ?? null;
        if (!is_string($value)) {
            $this->issue($key, 'invalid_type', $value === null ? 'Champ requis' : 'Chaîne attendue');
            return;
        }
        $value = self::trim($value);
        if (preg_match('/^[0-9a-fA-F]{64}$/', $value) !== 1) {
            $this->issue($key, 'invalid_string', 'Token invalide');
            return;
        }
        $this->data[$key] = $value;
    }

    // ─────────────────────────────── Dates ───────────────────────────────

    /** Date optionnelle YYYY-MM-DD ou "" (formulaires vides) — "" → null. */
    public function optDateOrEmpty(string $key): void
    {
        if (!$this->present($key)) {
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            $this->issue($key, 'invalid_type', 'Date attendue');
            return;
        }
        if ($value === '') {
            $this->data[$key] = null;
            return;
        }
        if (!is_string($value) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            $this->issue($key, 'invalid_string', 'Format attendu YYYY-MM-DD');
            return;
        }
        $this->data[$key] = $value;
    }

    // ─────────────────────────────── Listes / objets ───────────────────────────────

    /** Liste de chaînes optionnelle nullable, items trim 1..$itemMax (gallery…). */
    public function optStrList(string $key, int $itemMin, int $itemMax): void
    {
        if (!$this->present($key)) {
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            $this->data[$key] = null;
            return;
        }
        if (!is_array($value)) {
            $this->issue($key, 'invalid_type', 'Liste attendue');
            return;
        }
        $items = [];
        foreach (array_values($value) as $index => $item) {
            if (!is_string($item)) {
                $this->issue("$key.$index", 'invalid_type', 'Chaîne attendue');
                return;
            }
            $item = self::trim($item);
            $len = mb_strlen($item);
            if ($len < $itemMin || $len > $itemMax) {
                $this->issue("$key.$index", 'too_small', "Doit contenir entre $itemMin et $itemMax caractères");
                return;
            }
            $items[] = $item;
        }
        $this->data[$key] = $items;
    }

    /** Itinéraire optionnel nullable : [{day:int≥1, title:1..255, description?≤5000}]. */
    public function optItinerary(string $key): void
    {
        if (!$this->present($key)) {
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            $this->data[$key] = null;
            return;
        }
        if (!is_array($value)) {
            $this->issue($key, 'invalid_type', 'Liste attendue');
            return;
        }
        $items = [];
        foreach (array_values($value) as $index => $item) {
            if (!is_array($item)) {
                $this->issue("$key.$index", 'invalid_type', 'Objet attendu');
                return;
            }
            $day = $item['day'] ?? null;
            if (!is_numeric($day) || floor((float) $day) !== (float) $day || (int) $day < 1) {
                $this->issue("$key.$index.day", 'invalid_type', 'Nombre entier ≥ 1 attendu');
                return;
            }
            $title = $item['title'] ?? null;
            if (!is_string($title)) {
                $this->issue("$key.$index.title", 'invalid_type', 'Chaîne attendue');
                return;
            }
            $title = self::trim($title);
            if (mb_strlen($title) < 1 || mb_strlen($title) > 255) {
                $this->issue("$key.$index.title", 'too_small', 'Doit contenir entre 1 et 255 caractères');
                return;
            }
            $description = $item['description'] ?? null;
            if ($description !== null && (!is_string($description) || mb_strlen(self::trim($description)) > 5000)) {
                $this->issue("$key.$index.description", 'too_small', 'Doit contenir au plus 5000 caractères');
                return;
            }
            $items[] = [
                'day' => (int) $day,
                'title' => $title,
                'description' => $description === null ? null : self::trim($description),
            ];
        }
        $this->data[$key] = $items;
    }

    /** Couleur hexadécimale optionnelle nullable (#A855F7). */
    public function optHexColor(string $key): void
    {
        if (!$this->present($key)) {
            return;
        }
        $value = $this->input[$key];
        if ($value === null) {
            $this->data[$key] = null;
            return;
        }
        if (!is_string($value) || preg_match('/^#[0-9a-fA-F]{6}$/', self::trim($value)) !== 1) {
            $this->issue($key, 'invalid_string', 'Couleur hexadécimale attendue');
            return;
        }
        $this->data[$key] = self::trim($value);
    }

    /**
     * Record « texts » du endpoint translate — z.record(clé trim 1..100,
     * valeur trim 1..100000) avec les refines du schéma Next :
     * 1..20 entrées (messages exacts). Retourne le record validé.
     */
    public function texts(string $key): ?array
    {
        $value = $this->input[$key] ?? null;
        if (!is_array($value)) {
            $this->issue($key, 'invalid_type', $value === null ? 'Champ requis' : 'Objet attendu');
            return null;
        }
        $texts = [];
        foreach ($value as $field => $text) {
            $field = is_string($field) ? self::trim($field) : (string) $field;
            if ($field === '' || mb_strlen($field) > 100) {
                $this->custom([$key, $field], 'Clé invalide (1 à 100 caractères)', 'invalid_string');
                return null;
            }
            if (!is_string($text)) {
                $this->custom([$key, $field], 'Chaîne attendue', 'invalid_type');
                return null;
            }
            $text = self::trim($text);
            if ($text === '' || mb_strlen($text) > 100000) {
                $this->custom([$key, $field], 'Doit contenir entre 1 et 100000 caractères', 'too_small');
                return null;
            }
            $texts[$field] = $text;
        }
        $count = count($texts);
        if ($count === 0) {
            $this->custom([], 'Au moins un texte à traduire est requis');
            return null;
        }
        if ($count > 20) {
            $this->custom([], '20 textes maximum par requête');
            return null;
        }
        $this->data[$key] = $texts;
        return $texts;
    }

    // ─────────────────────────────── Query params ───────────────────────────────

    /**
     * page (défaut 1) — z.coerce.number().int().min(1).
     * En query, les valeurs invalides produisent un 400 (comme Next).
     */
    public function page(): int
    {
        $value = $this->coerceQueryParam('page', 1);
        if ($value !== null && $value < 1) {
            $this->issue('page', 'too_small', 'Doit être ≥ 1');
            return 1;
        }
        return $value ?? 1;
    }

    /** pageSize (défaut 20, max 100). */
    public function pageSize(): int
    {
        $value = $this->coerceQueryParam('pageSize', 20);
        if ($value !== null && ($value < 1 || $value > 100)) {
            $this->issue('pageSize', 'too_big', 'Doit être compris entre 1 et 100');
            return 20;
        }
        return $value ?? 20;
    }

    private function coerceQueryParam(string $key, int $default): ?int
    {
        if (!$this->present($key)) {
            return null;
        }
        $value = $this->input[$key];
        if (!is_numeric($value) || floor((float) $value) !== (float) $value) {
            $this->issue($key, 'invalid_type', 'Nombre entier attendu');
            return null;
        }
        return (int) $value;
    }

    /** Recherche q — trim, min 1 (chaîne vide → 400, comme z.min(1).optional()). */
    public function q(): ?string
    {
        if (!$this->present('q')) {
            return null;
        }
        $value = $this->input['q'];
        if (!is_string($value)) {
            $this->issue('q', 'invalid_type', 'Chaîne attendue');
            return null;
        }
        $value = self::trim($value);
        if ($value === '') {
            $this->issue('q', 'too_small', 'Ne peut pas être vide');
            return null;
        }
        return $value;
    }

    /** Paramètre string optionnel trim min 1 (destination, category…). */
    public function optQueryParam(string $key): ?string
    {
        if (!$this->present($key)) {
            return null;
        }
        $value = $this->input[$key];
        if (!is_string($value)) {
            $this->issue($key, 'invalid_type', 'Chaîne attendue');
            return null;
        }
        $value = self::trim($value);
        if ($value === '') {
            $this->issue($key, 'too_small', 'Ne peut pas être vide');
            return null;
        }
        return $value;
    }

    /** Booléen query ?featured=true|false (énum stricte) → bool|null. */
    public function boolQuery(string $key): ?bool
    {
        if (!$this->present($key)) {
            return null;
        }
        $value = $this->input[$key];
        if ($value === 'true') {
            return true;
        }
        if ($value === 'false') {
            return false;
        }
        $this->issue($key, 'invalid_enum_value', 'Valeur non autorisée (true|false)');
        return null;
    }

    /** Énum query optionnelle (status, role, requestType…). */
    public function queryEnum(string $key, array $values): ?string
    {
        $value = $this->optQueryParam($key);
        if ($value === null) {
            return null;
        }
        if (!in_array($value, $values, true)) {
            $this->issue($key, 'invalid_enum_value', 'Valeur non autorisée');
            return null;
        }
        return $value;
    }

    /** Nombre query optionnel coerce (maxPrice) — min 0 par défaut. */
    public function queryNum(string $key, float $min, bool $int = false): ?float
    {
        if (!$this->present($key)) {
            return null;
        }
        $value = $this->input[$key];
        if (!is_numeric($value)) {
            $this->issue($key, 'invalid_type', 'Nombre attendu');
            return null;
        }
        $number = (float) $value;
        if ($int && floor($number) !== $number) {
            $this->issue($key, 'invalid_type', 'Nombre entier attendu');
            return null;
        }
        if ($number < $min) {
            $this->issue($key, 'too_small', "Doit être ≥ $min");
            return null;
        }
        return $number;
    }
}
