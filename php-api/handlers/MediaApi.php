<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Db;
use WT\Env;
use WT\External;
use WT\Http;
use WT\Router;
use WT\Serial;
use WT\Slug;
use WT\Support;
use WT\Validator;

/**
 * Médiathèque dashboard — port des routes app/api/dashboard/media :
 * GET liste, POST upload multipart (imgBB distant ou dépôt local),
 * PATCH/DELETE /{id} (textes alternatifs, suppression ligne+fichier).
 */
final class MediaApi
{
    private const TABLE = 'media_library';

    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
    ];

    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

    public static function registerRoutes(): void
    {
        Router::get('/api/dashboard/media', [self::class, 'list']);
        Router::post('/api/dashboard/media', [self::class, 'upload']);
        Router::patch('/api/dashboard/media/{id}', [self::class, 'update']);
        Router::delete('/api/dashboard/media/{id}', [self::class, 'delete']);
    }

    /** GET — tout rôle authentifié ; q sur filename/alt_text, tri createdAt desc. */
    public static function list(): never
    {
        Auth::requireSession();

        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $v->fail();

        $where = [];
        $params = [];
        if ($q !== null) {
            $where[] = '(t.filename ILIKE ? OR t.alt_text ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }
        $whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $rows = Db::all(
            'SELECT t.* FROM ' . self::TABLE . ' t' . $whereSql
            . ' ORDER BY t.created_at DESC'
            . ' LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
            $params
        );
        $total = (int) Db::val('SELECT COUNT(*) FROM ' . self::TABLE . ' t' . $whereSql, $params);
        Http::ok(Serial::list(
            array_map(static fn (array $row): array => Serial::mediaFile($row), $rows),
            $total,
            $page,
            $pageSize
        ));
    }

    /**
     * POST — multipart/form-data {file, altText?, altTextEn?} → 201 média.
     * Mêmes validations que lib/services/media.ts (taille, type MIME),
     * mêmes messages d'erreur. imgBB si configuré, sinon uploads/ local.
     */
    public static function upload(): never
    {
        Auth::requireSession(['admin', 'editor']);

        $contentType = (string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
        if (!str_starts_with(strtolower($contentType), 'multipart/form-data')) {
            Http::badRequest('Corps multipart/form-data attendu');
        }
        $file = $_FILES['file'] ?? null;
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            Http::badRequest("Champ 'file' manquant ou invalide");
        }

        // altText/altTextEn : chaîne non vide → valeur brute (pas de trim
        // côté Next sur l'upload), sinon null.
        $altText = self::postString('altText');
        $altTextEn = self::postString('altTextEn');

        $size = (int) ($file['size'] ?? 0);
        if ($size === 0) {
            Http::badRequest('Fichier vide');
        }
        if ($size > self::MAX_FILE_SIZE) {
            Http::badRequest('Fichier trop volumineux (max 5 Mo)');
        }
        $mimeType = (string) ($file['type'] ?? '');
        if ($mimeType === '' || !in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            Http::badRequest('Type de fichier non autorisé (' . ($mimeType !== '' ? $mimeType : 'inconnu') . ')');
        }

        // Nom sûr : alphanumérique + tirets, préfixe « Date.now() » en ms.
        $safeName = self::safeName((string) $file['name']);
        $uniqueName = (string) round(microtime(true) * 1000) . '-' . $safeName;

        if (External::isImgbbConfigured()) {
            // Stockage distant imgBB : url = display_url, storagePath = delete_url.
            try {
                $uploaded = External::uploadToImgbb((string) $file['tmp_name'], (string) $file['name']);
            } catch (\RuntimeException $e) {
                Http::serverError($e->getMessage()); // ImgbbUploadError côté Next
            }
            $url = $uploaded['url'];
            $storagePath = $uploaded['deleteUrl'];
        } else {
            // Stockage local : uploads/ à la racine du site, url /uploads/<nom>.
            $dir = Env::get('uploads_dir');
            $dir = ($dir !== null && $dir !== '') ? rtrim($dir, '/') : dirname(__DIR__, 2) . '/uploads';
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
                throw new \RuntimeException("Impossible de créer le répertoire uploads : $dir");
            }
            $destPath = $dir . '/' . $uniqueName;
            if (!move_uploaded_file((string) $file['tmp_name'], $destPath)) {
                throw new \RuntimeException("Écriture impossible : $destPath");
            }
            $url = '/uploads/' . $uniqueName;
            $storagePath = $destPath;
        }

        $row = Db::one(
            'INSERT INTO ' . self::TABLE
            . ' (id, filename, storage_path, url, mime_type, size, width, height, alt_text, alt_text_en, uploaded_by, created_at)'
            . ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
            [
                Db::uuid(),
                (string) $file['name'],
                $storagePath,
                $url,
                $mimeType,
                $size,
                null,          // width/height : jamais calculés côté Next non plus
                null,
                $altText,
                $altTextEn,
                null,          // uploadedBy : la route Next ne le fournit pas
                Support::now(),
            ]
        );
        Http::created(Serial::mediaFile($row));
    }

    /** PATCH /{id} — textes alternatifs FR/EN uniquement (clés fournies seulement). */
    public static function update(string $id): never
    {
        Auth::requireSession(['admin', 'editor']);

        if (!Support::isUuid($id)) {
            Http::notFound('Fichier introuvable');
        }
        $v = Validator::body();
        $v->optStr('altText', 255);
        $v->optStr('altTextEn', 255);
        $v->fail();
        $data = $v->d();

        $set = [];
        $params = [];
        if (array_key_exists('altText', $data)) {
            $set[] = 'alt_text = ?';
            $params[] = $data['altText'];
        }
        if (array_key_exists('altTextEn', $data)) {
            $set[] = 'alt_text_en = ?';
            $params[] = $data['altTextEn'];
        }
        // media_library n'a pas de colonne @updatedAt ; un corps sans champ
        // renvoie simplement la ligne courante (update Prisma à data vide).
        $row = $set === []
            ? Db::one('SELECT * FROM ' . self::TABLE . ' WHERE id = ?', [$id])
            : Db::one(
                'UPDATE ' . self::TABLE . ' SET ' . implode(', ', $set) . ' WHERE id = ? RETURNING *',
                [...$params, $id]
            );
        if ($row === null) {
            Http::notFound(); // P2025
        }
        Http::ok(Serial::mediaFile($row));
    }

    /** DELETE /{id} — {message, id, url} ; fichier local unlink best effort. */
    public static function delete(string $id): never
    {
        Auth::requireSession(['admin', 'editor']);

        if (!Support::isUuid($id)) {
            Http::notFound('Fichier introuvable');
        }
        $media = Db::one('SELECT * FROM ' . self::TABLE . ' WHERE id = ?', [$id]);
        if ($media === null) {
            Http::notFound('Fichier média introuvable');
        }
        Db::run('DELETE FROM ' . self::TABLE . ' WHERE id = ?', [$id]);

        // Fichier local (chemin absolu) : suppression best effort. imgBB ne
        // stocke qu'une référence (delete_url, pas d'API de suppression).
        if (is_string($media['storage_path']) && str_starts_with($media['storage_path'], '/')) {
            @unlink($media['storage_path']);
        }
        Http::ok(['message' => 'Fichier supprimé', 'id' => $id, 'url' => $media['url']]);
    }

    // ─────────────────────────────── Internes ───────────────────────────────

    /** Champ POST : chaîne non vide → valeur brute, sinon null (pas de trim). */
    private static function postString(string $key): ?string
    {
        $value = $_POST[$key] ?? null;
        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * Nom de fichier sûr — port exact de media.ts : NFD → suppression des
     * signes combinants → minuscules → [^a-z0-9.]+ → « - » → bords trimmés →
     * 120 derniers caractères (slice(-120)).
     */
    private static function safeName(string $name): string
    {
        $name = mb_strtolower($name);
        $name = preg_replace('/[\x{0300}-\x{036F}]/u', '', $name) ?? '';
        $name = strtr($name, Slug::TRANSLIT);
        $name = preg_replace('/[^a-z0-9.]+/', '-', $name) ?? '';
        $name = trim($name, '-');
        return mb_substr($name, -120);
    }
}
