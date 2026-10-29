<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Db;
use WT\Http;
use WT\Router;
use WT\Schemas;
use WT\Serial;
use WT\Support;
use WT\Validator;

/**
 * Paramètres dashboard — port de app/api/dashboard/settings :
 * GET {items} (trié par clé, SANS enveloppe de pagination) et PUT upsert
 * groupé (value toujours écrite, description seulement si fournie).
 */
final class SettingsApi
{
    public static function registerRoutes(): void
    {
        Router::get('/api/dashboard/settings', [self::class, 'list']);
        Router::put('/api/dashboard/settings', [self::class, 'put']);
    }

    /** GET — tout rôle authentifié ; orderBy key asc. */
    public static function list(): never
    {
        Auth::requireSession();
        $rows = Db::all('SELECT * FROM settings ORDER BY "key" ASC');
        Http::ok([
            'items' => array_map(static fn (array $row): array => Serial::setting($row), $rows),
        ]);
    }

    /** PUT — admin+éditeur ; upsert groupé, items dans l'ordre d'entrée. */
    public static function put(): never
    {
        Auth::requireSession(['admin', 'editor']);

        $v = Validator::body();
        $entries = Schemas::settingsPut($v);
        $v->fail();

        $items = Db::transaction(static function () use ($entries): array {
            $out = [];
            foreach ($entries as $entry) {
                $out[] = self::upsert($entry);
            }
            return $out;
        });

        \WT\External::triggerRebuild();
        Http::ok(['items' => $items, 'message' => 'Paramètres enregistrés']);
    }

    /**
     * Upsert atomique (INSERT … ON CONFLICT, comme l'upsert natif Prisma) :
     * value toujours écrite, description seulement quand fournie
     * (hasDescription — `!== undefined` côté Next), updated_at systématique.
     *
     * @param array{key: string, value: ?string, description?: ?string, hasDescription: bool} $entry
     */
    private static function upsert(array $entry): array
    {
        $hasDescription = $entry['hasDescription'];
        $columns = ['id', '"key"', 'value'];
        $params = [Db::uuid(), $entry['key'], $entry['value']];
        if ($hasDescription) {
            $columns[] = 'description';
            $params[] = $entry['description'];
        }
        $columns[] = 'updated_at';
        $params[] = Support::now();

        $row = Db::one(
            'INSERT INTO settings (' . implode(', ', $columns) . ')'
            . ' VALUES (' . implode(', ', array_fill(0, count($params), '?')) . ')'
            . ' ON CONFLICT ("key") DO UPDATE SET'
            . ' value = EXCLUDED.value'
            . ($hasDescription ? ', description = EXCLUDED.description' : '')
            . ', updated_at = EXCLUDED.updated_at'
            . ' RETURNING *',
            $params
        );
        return Serial::setting($row ?? []);
    }
}
