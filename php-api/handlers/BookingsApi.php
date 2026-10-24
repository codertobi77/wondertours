<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Db;
use WT\External;
use WT\Http;
use WT\MailTemplates;
use WT\Router;
use WT\Serial;
use WT\Support;
use WT\Validator;

/**
 * Réservations dashboard — port des routes app/api/dashboard/bookings :
 * GET liste (circuit {id,title,slug} joint) et PATCH /{id}/status
 * (notification client best effort au changement réel de statut).
 */
final class BookingsApi
{
    private const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

    public static function registerRoutes(): void
    {
        Router::get('/api/dashboard/bookings', [self::class, 'list']);
        Router::patch('/api/dashboard/bookings/{id}/status', [self::class, 'updateStatus']);
    }

    /** GET — tout rôle authentifié ; q sur nom/email client/référence, filtre status. */
    public static function list(): never
    {
        Auth::requireSession();

        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $status = $v->queryEnum('status', self::STATUSES);
        $v->fail();

        $where = [];
        $params = [];
        if ($status !== null) {
            $where[] = 't.status = ?';
            $params[] = $status;
        }
        if ($q !== null) {
            $where[] = '(t.customer_name ILIKE ? OR t.customer_email ILIKE ? OR t.booking_reference ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }
        $whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $rows = Db::all(
            'SELECT t.*, c.id AS c_id, c.title AS c_title, c.slug AS c_slug'
            . ' FROM bookings t LEFT JOIN circuits c ON c.id = t.circuit_id'
            . $whereSql
            . ' ORDER BY t.created_at DESC'
            . ' LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
            $params
        );
        $total = (int) Db::val('SELECT COUNT(*) FROM bookings t' . $whereSql, $params);
        Http::ok(Serial::list(
            array_map(static fn (array $row): array => Serial::booking($row), $rows),
            $total,
            $page,
            $pageSize
        ));
    }

    /** PATCH /{id}/status — admin+éditeur ; 404 « Réservation introuvable ». */
    public static function updateStatus(string $id): never
    {
        Auth::requireSession(['admin', 'editor']);

        if (!Support::isUuid($id)) {
            Http::notFound('Réservation introuvable');
        }
        $v = Validator::body();
        $v->reqEnum('status', self::STATUSES);
        $v->fail();
        $status = $v->d()['status'];

        $existing = Db::one('SELECT * FROM bookings WHERE id = ?', [$id]);
        if ($existing === null) {
            Http::notFound('Réservation introuvable');
        }

        $updated = Db::one(
            'UPDATE bookings SET status = ?, updated_at = ? WHERE id = ? RETURNING *',
            [$status, Support::now(), $id]
        );
        if ($updated === null) {
            Http::notFound(); // P2025 : disparue entre la lecture et l'écriture
        }

        // Notification client best effort si le statut change réellement
        // (circuitTitle relu pour l'email, comme getBookingWithCircuitById).
        if ($existing['status'] !== $updated['status']) {
            $circuitTitle = $updated['circuit_id'] !== null
                ? Db::val('SELECT title FROM circuits WHERE id = ?', [$updated['circuit_id']])
                : null;
            $email = MailTemplates::bookingStatusEmail([
                'name' => $updated['customer_name'],
                'bookingReference' => $updated['booking_reference'],
                'circuitTitle' => is_string($circuitTitle) ? $circuitTitle : null,
                'status' => $updated['status'],
            ]);
            External::sendEmailSafe([
                'to' => $updated['customer_email'],
                'subject' => $email['subject'],
                'html' => $email['html'],
            ]);
        }

        // Réponse = ligne brute SANS circuit, comme le update Prisma.
        Http::ok(Serial::booking($updated));
    }
}
