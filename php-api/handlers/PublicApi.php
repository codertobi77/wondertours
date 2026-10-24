<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Circuits;
use WT\Db;
use WT\Http;
use WT\Model;
use WT\Serial;
use WT\Validator;

/**
 * Endpoints publics (sans session) — port des routes app/api/* publiques.
 * Phase A : circuits. Phase B : destinations, categories, services,
 * témoignages, blog (+ compteur de vues), POST contact, POST bookings.
 *
 * Les emails Resend (confirmation visiteur + notification équipe) sont
 * « best effort » côté Next (sendEmailSafe, jamais bloquants) — ils
 * seront branchés ici sur External.php avec le port des gabarits
 * (MailTemplates) : cf. TODO e7e3ab3e.
 */
final class PublicApi
{
    /** Mapping requestType formulaire → enum base (sejour→stay, autre→other). */
    private const REQUEST_TYPE_MAPPING = [
        'circuit' => 'circuit',
        'sejour' => 'stay',
        'stay' => 'stay',
        'hotel' => 'hotel',
        'info' => 'info',
        'autre' => 'other',
        'other' => 'other',
    ];

    // ─────────────────────────────── Circuits (Phase A) ───────────────────────────────

    private static function circuitJoins(): string
    {
        return 'LEFT JOIN destinations d ON d.id = t.destination_id';
    }

    /** SELECT circuit + colonnes préfixées de la destination jointe (d_). */
    private static function circuitSelect(): string
    {
        return 'SELECT t.*, '
            . Model::prefixed(Model::DESTINATION, 'd', 'd_')
            . ' FROM circuits t ' . self::circuitJoins();
    }

    /** GET /api/circuits — circuits actifs, filtres q/destination/category/featured/maxPrice/maxDuration. */
    public static function circuits(): never
    {
        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $destination = $v->optQueryParam('destination');
        $category = $v->optQueryParam('category');
        $featured = $v->boolQuery('featured');
        $maxPrice = $v->queryNum('maxPrice', 0);
        $maxDuration = $v->queryNum('maxDuration', 1, int: true);
        $v->fail();

        $where = ['t.is_active = true'];
        $params = [];
        if ($q !== null) {
            $where[] = '(t.title ILIKE ? OR t.description ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }
        if ($destination !== null) {
            $where[] = 'd.slug = ?';
            $params[] = $destination;
        }
        if ($category !== null) {
            // categories: { some: { slug } } — table m-n "_CategoryToCircuit"
            // ("A" → categories.id, "B" → circuits.id).
            $where[] = 'EXISTS (SELECT 1 FROM "_CategoryToCircuit" jx'
                . ' JOIN categories kx ON kx.id = jx."A"'
                . ' WHERE jx."B" = t.id AND kx.slug = ?)';
            $params[] = $category;
        }
        if ($featured !== null) {
            $where[] = $featured ? 't.is_featured = true' : 't.is_featured = false';
        }
        if ($maxPrice !== null) {
            $where[] = 't.price <= ?';
            $params[] = $maxPrice;
        }
        if ($maxDuration !== null) {
            $where[] = 't.duration_days <= ?';
            $params[] = $maxDuration;
        }
        $whereSql = ' WHERE ' . implode(' AND ', $where);

        $rows = Db::all(
            self::circuitSelect() . $whereSql
            . ' ORDER BY t.is_featured DESC, t.created_at DESC'
            . ' LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
            $params
        );
        $total = (int) Db::val(
            'SELECT COUNT(*) FROM circuits t ' . self::circuitJoins() . $whereSql,
            $params
        );

        Http::ok(Serial::list(Circuits::attach($rows), $total, $page, $pageSize));
    }

    /** GET /api/circuits/{slug} — circuit actif par slug, 404 « Circuit introuvable ». */
    public static function circuitBySlug(string $slug): never
    {
        $row = Db::one(
            self::circuitSelect() . ' WHERE t.slug = ? AND t.is_active = true LIMIT 1',
            [$slug]
        );
        if ($row === null) {
            Http::notFound('Circuit introuvable');
        }
        Http::ok(Circuits::attachOne($row));
    }

    // ─────────────────────────────── Listes publiques (Phase B) ───────────────────────────────

    /**
     * Liste paginée générique : WHERE, COUNT, LIMIT/OFFSET, enveloppe du
     * contrat {items, total, page, pageSize}.
     *
     * @param array{0: string, 1: array<int, string>} $where [conditions AND-joibables, params]
     */
    private static function paged(string $select, string $countFrom, array $where, string $orderBy, int $page, int $pageSize, \Closure $serialize): never
    {
        $whereSql = $where[0] === '' ? '' : ' WHERE ' . $where[0];
        $rows = Db::all(
            $select . $whereSql
            . ' ORDER BY ' . $orderBy
            . ' LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
            $where[1]
        );
        $total = (int) Db::val('SELECT COUNT(*) FROM ' . $countFrom . $whereSql, $where[1]);
        Http::ok(Serial::list(array_map($serialize, $rows), $total, $page, $pageSize));
    }

    /** GET /api/destinations — actives, q sur nom/pays, tri par nom (listDestinations). */
    public static function destinations(): never
    {
        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $v->fail();

        $where = ['t.is_active = true'];
        $params = [];
        if ($q !== null) {
            $where[] = '(t.name ILIKE ? OR t.country ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }

        self::paged(
            'SELECT t.* FROM destinations t',
            'destinations t',
            [implode(' AND ', $where), $params],
            't.name ASC',
            $page,
            $pageSize,
            static fn (array $row): array => Serial::destination($row)
        );
    }

    /** GET /api/categories — actives, q sur nom, tri sortOrder puis nom (listCategories). */
    public static function categories(): never
    {
        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $v->fail();

        $where = ['t.is_active = true'];
        $params = [];
        if ($q !== null) {
            $where[] = 't.name ILIKE ?';
            $params[] = '%' . $q . '%';
        }

        self::paged(
            'SELECT t.* FROM categories t',
            'categories t',
            [implode(' AND ', $where), $params],
            't.sort_order ASC, t.name ASC',
            $page,
            $pageSize,
            static fn (array $row): array => Serial::category($row)
        );
    }

    /** GET /api/services — actifs, q sur titre/description, tri sortOrder puis createdAt. */
    public static function services(): never
    {
        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $v->fail();

        $where = ['t.is_active = true'];
        $params = [];
        if ($q !== null) {
            $where[] = '(t.title ILIKE ? OR t.description ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }

        self::paged(
            'SELECT t.* FROM services t',
            'services t',
            [implode(' AND ', $where), $params],
            't.sort_order ASC, t.created_at ASC',
            $page,
            $pageSize,
            static fn (array $row): array => Serial::service($row)
        );
    }

    /** GET /api/testimonials — actifs, filtre featured, q sur nom/texte, tri featured puis date. */
    public static function testimonials(): never
    {
        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $featured = $v->boolQuery('featured');
        $v->fail();

        $where = ['t.is_active = true'];
        $params = [];
        if ($featured !== null) {
            $where[] = $featured ? 't.is_featured = true' : 't.is_featured = false';
        }
        if ($q !== null) {
            $where[] = '(t.name ILIKE ? OR t.text ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }

        self::paged(
            'SELECT t.* FROM testimonials t',
            'testimonials t',
            [implode(' AND ', $where), $params],
            't.is_featured DESC, t.date DESC',
            $page,
            $pageSize,
            static fn (array $row): array => Serial::testimonial($row)
        );
    }

    private static function blogJoins(): string
    {
        return 'LEFT JOIN blog_categories bc ON bc.id = t.category_id'
            . ' LEFT JOIN users a ON a.id = t.author_id';
    }

    /** SELECT article + relations préfixées category (bc_) et author (a_). */
    private static function blogSelect(): string
    {
        return 'SELECT t.*, '
            . Model::prefixed(Model::BLOG_CATEGORY, 'bc', 'bc_') . ', '
            . Model::prefixed(Model::USER, 'a', 'a_')
            . ' FROM blog_posts t ' . self::blogJoins();
    }

    /** GET /api/blog — publiés ; filtres q, category (slug), featured ; relations category+author. */
    public static function blog(): never
    {
        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $category = $v->optQueryParam('category');
        $featured = $v->boolQuery('featured');
        $v->fail();

        $where = ['t.is_published = true'];
        $params = [];
        if ($q !== null) {
            $where[] = '(t.title ILIKE ? OR t.excerpt ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }
        if ($category !== null) {
            $where[] = 'bc.slug = ?';
            $params[] = $category;
        }
        if ($featured !== null) {
            $where[] = $featured ? 't.is_featured = true' : 't.is_featured = false';
        }

        self::paged(
            self::blogSelect(),
            'blog_posts t ' . self::blogJoins(),
            [implode(' AND ', $where), $params],
            't.is_featured DESC, t.published_at DESC',
            $page,
            $pageSize,
            static fn (array $row): array => Serial::blogPost($row, true)
        );
    }

    /**
     * GET /api/blog/{slug} — article publié ; le compteur de vues est
     * incrémenté après sérialisation (la réponse rend le total d'avant,
     * comme le void …catch() asynchrone côté Next).
     */
    public static function blogBySlug(string $slug): never
    {
        $row = Db::one(
            self::blogSelect() . ' WHERE t.slug = ? AND t.is_published = true LIMIT 1',
            [$slug]
        );
        if ($row === null) {
            Http::notFound('Article introuvable');
        }
        $post = Serial::blogPost($row, true);
        // Best effort — jamais bloquant pour la réponse. @updatedAt Prisma
        // est également rafraîchi par l'update des vues.
        try {
            Db::run('UPDATE blog_posts SET views = views + 1, updated_at = NOW() WHERE id = ?', [$row['id']]);
        } catch (\Throwable) {
            // ignoré, comme .catch(() => {}) côté Next
        }
        Http::ok($post);
    }

    // ─────────────────────────────── POST contact ───────────────────────────────

    /** POST /api/contact — crée la demande (statut new), 201 {message, id}. */
    public static function contact(): never
    {
        $v = Validator::body();
        $v->str('name', 2, 255);
        $v->email('email', required: true);
        $v->optStr('phone', 50, nullable: false);
        $v->optStr('subject', 255, nullable: false);
        $v->enum('requestType', array_keys(self::REQUEST_TYPE_MAPPING), 'info', nullable: false);
        $v->optDateOrEmpty('travelDate');
        $v->optNum('travelers', 1, 100, int: true, nullable: false);
        $v->str('message', 10, 5000);
        $v->fail();
        $data = $v->d();

        $id = Db::uuid();
        $now = self::now();
        Db::run(
            'INSERT INTO contact_requests'
            . ' (id, name, email, phone, subject, request_type, travel_date, travelers, message, status, created_at, updated_at)'
            . ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $data['name'],
                $data['email'],
                self::emptyToNull($data['phone'] ?? null),      // "" → null (|| null)
                self::emptyToNull($data['subject'] ?? null),
                self::REQUEST_TYPE_MAPPING[$data['requestType'] ?? 'info'],
                $data['travelDate'] ?? null,
                $data['travelers'] ?? null,
                $data['message'],
                'new',
                $now,
                $now,
            ]
        );

        // TODO (e7e3ab3e) : sendEmailSafe ×2 (confirmation visiteur +
        // notification équipe) — best effort, jamais bloquants.

        Http::created(['message' => 'Demande envoyée avec succès', 'id' => $id]);
    }

    // ─────────────────────────────── POST bookings ───────────────────────────────

    /** Référence lisible unique : WT-XXXXXX (base 36, 6 caractères, complétée de zéros). */
    private static function generateBookingReference(): string
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $ref = 'WT-' . str_pad(
                substr(strtoupper(base_convert((string) random_int(0, 4294967295), 10, 36)), 0, 6),
                6,
                '0',
                STR_PAD_LEFT
            );
            if (Db::val('SELECT id FROM bookings WHERE booking_reference = ?', [$ref]) === null) {
                return $ref;
            }
        }
        throw new \RuntimeException('Impossible de générer une référence de réservation unique');
    }

    /**
     * POST /api/bookings — référence unique, statut pending, totalPrice =
     * prix du circuit × participants (défaut 1) quand un circuit est fourni.
     */
    public static function bookings(): never
    {
        $v = Validator::body();
        $v->optUuid('circuitId', nullable: false);
        $v->enum('type', ['circuit', 'stay', 'hotel'], 'circuit', nullable: false);
        $v->str('name', 2, 255);
        $v->email('email', required: true);
        $v->optStr('phone', 50, nullable: false);
        $v->optDateOrEmpty('travelDate');
        $v->optDateOrEmpty('returnDate');
        $v->optNum('participants', 1, 100, int: true, nullable: false);
        $v->optStr('notes', 5000, nullable: false);
        $v->fail();
        $data = $v->d();

        // Si un circuit est fourni, il doit exister et être actif
        // (getCircuitById + garde isActive du route handler Next).
        $circuit = null;
        if ($data['circuitId'] !== null) {
            $circuit = Db::one('SELECT * FROM circuits WHERE id = ?', [$data['circuitId']]);
            if ($circuit === null || !self::pgBool($circuit['is_active'])) {
                Http::badRequest('Circuit invalide ou introuvable');
            }
        }

        // totalPrice = prix × participants (défaut 1) — Number(price) × n.
        $totalPrice = null;
        if ($circuit !== null) {
            $totalPrice = (float) $circuit['price'] * ($data['participants'] ?? 1);
        }

        $row = Db::one(
            'INSERT INTO bookings'
            . ' (id, booking_reference, type, circuit_id, customer_name, customer_email, customer_phone,'
            . ' travel_date, return_date, participants, total_price, currency, notes, status, created_at, updated_at)'
            . ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
            [
                Db::uuid(),
                self::generateBookingReference(),
                $data['type'],
                $data['circuitId'] ?? null,
                $data['name'],
                $data['email'],
                self::emptyToNull($data['phone'] ?? null),      // "" → null (|| null)
                $data['travelDate'] ?? null,
                $data['returnDate'] ?? null,
                $data['participants'] ?? null,
                $totalPrice,
                'XOF',                                          // input.currency ?? "XOF" (non fourni par la route)
                self::emptyToNull($data['notes'] ?? null),
                'pending',
                self::now(),
                self::now(),
            ]
        );
        $booking = Serial::booking($row);

        // TODO (e7e3ab3e) : sendEmailSafe ×2 (confirmation client +
        // notification équipe) — best effort, jamais bloquants.

        Http::created([
            'message' => 'Réservation enregistrée avec succès',
            'id' => $booking['id'],
            'bookingReference' => $booking['bookingReference'],
            'totalPrice' => $booking['totalPrice'],
            'currency' => $booking['currency'],
            'status' => $booking['status'],
        ]);
    }

    // ─────────────────────────────── Internes ───────────────────────────────

    /** équivalent JS `x || null` sur les chaînes trimmées : "" → null. */
    private static function emptyToNull(?string $value): ?string
    {
        return $value === '' ? null : $value;
    }

    /** Booléen PDO/pgsql ('t'/'f', true/false, '1'/'0'). */
    private static function pgBool(mixed $value): bool
    {
        return $value === true || $value === 't' || $value === 1 || $value === '1';
    }

    /** Horodatage UTC microsecondes — @default(now())/@updatedAt de Prisma. */
    private static function now(): string
    {
        return (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s.u');
    }
}
