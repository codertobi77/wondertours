<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Db;
use WT\Http;
use WT\Router;
use WT\Serial;
use WT\Support;
use WT\Validator;

/**
 * Demandes de contact dashboard — port des routes
 * app/api/dashboard/contact-requests : GET liste (filtres status,
 * requestType, q) et PATCH /{id}/status.
 */
final class ContactRequestsApi
{
    private const STATUSES = ['new', 'in_progress', 'answered', 'closed'];
    private const REQUEST_TYPES = ['circuit', 'stay', 'hotel', 'info', 'other'];

    public static function registerRoutes(): void
    {
        Router::get('/api/dashboard/contact-requests', [self::class, 'list']);
        Router::patch('/api/dashboard/contact-requests/{id}/status', [self::class, 'updateStatus']);
    }

    /** GET — tout rôle authentifié ; q sur nom/email/sujet. */
    public static function list(): never
    {
        Auth::requireSession();

        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $status = $v->queryEnum('status', self::STATUSES);
        $requestType = $v->queryEnum('requestType', self::REQUEST_TYPES);
        $v->fail();

        $where = [];
        $params = [];
        if ($status !== null) {
            $where[] = 't.status = ?';
            $params[] = $status;
        }
        if ($requestType !== null) {
            $where[] = 't.request_type = ?';
            $params[] = $requestType;
        }
        if ($q !== null) {
            $where[] = '(t.name ILIKE ? OR t.email ILIKE ? OR t.subject ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }
        $whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $rows = Db::all(
            'SELECT t.* FROM contact_requests t' . $whereSql
            . ' ORDER BY t.created_at DESC'
            . ' LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
            $params
        );
        $total = (int) Db::val('SELECT COUNT(*) FROM contact_requests t' . $whereSql, $params);
        Http::ok(Serial::list(
            array_map(static fn (array $row): array => Serial::contactRequest($row), $rows),
            $total,
            $page,
            $pageSize
        ));
    }

    /** PATCH /{id}/status — admin+éditeur ; 404 « Demande introuvable ». */
    public static function updateStatus(string $id): never
    {
        Auth::requireSession(['admin', 'editor']);

        if (!Support::isUuid($id)) {
            Http::notFound('Demande introuvable');
        }
        $v = Validator::body();
        $v->reqEnum('status', self::STATUSES);
        $v->fail();
        $status = $v->d()['status'];

        $existing = Db::one('SELECT id FROM contact_requests WHERE id = ?', [$id]);
        if ($existing === null) {
            Http::notFound('Demande introuvable');
        }

        $updated = Db::one(
            'UPDATE contact_requests SET status = ?, updated_at = ? WHERE id = ? RETURNING *',
            [$status, Support::now(), $id]
        );
        if ($updated === null) {
            Http::notFound(); // P2025 : disparue entre la lecture et l'écriture
        }
        Http::ok(Serial::contactRequest($updated));
    }
}
