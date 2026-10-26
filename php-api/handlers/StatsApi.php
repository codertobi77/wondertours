<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Db;
use WT\Http;
use WT\Router;
use WT\Serial;
use WT\Support;

/**
 * GET /api/dashboard/stats — port de app/api/dashboard/stats +
 * lib/services/stats.ts : agrégats des 9 ressources et les 5 dernières
 * réservations/demandes. Tout rôle authentifié.
 *
 * Parité JSON : les nombres « ronds » sortent comme des entiers (4 et non
 * 4.0) via Support::number — JSON.stringify côté JS.
 */
final class StatsApi
{
    public static function registerRoutes(): void
    {
        Router::get('/api/dashboard/stats', [self::class, 'get']);
    }

    public static function get(): never
    {
        Auth::requireSession();

        // Début du mois courant (UTC — fuseau de session PDO).
        $startOfMonth = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
            ->format('Y-m-01 00:00:00');

        $circuitActive = (int) Db::val('SELECT COUNT(*) FROM circuits WHERE is_active = true');
        $circuitTotal = (int) Db::val('SELECT COUNT(*) FROM circuits');
        $circuitFeatured = (int) Db::val(
            'SELECT COUNT(*) FROM circuits WHERE is_active = true AND is_featured = true'
        );
        $destinationActive = (int) Db::val('SELECT COUNT(*) FROM destinations WHERE is_active = true');
        $destinationTotal = (int) Db::val('SELECT COUNT(*) FROM destinations');
        $categoryActive = (int) Db::val('SELECT COUNT(*) FROM categories WHERE is_active = true');
        $categoryTotal = (int) Db::val('SELECT COUNT(*) FROM categories');

        // Agrégat témoignages actifs : moyenne (JS : _avg.rating falsy → null).
        $testimonialAgg = Db::one(
            'SELECT COUNT(*) AS active_count, AVG(rating) AS avg_rating FROM testimonials WHERE is_active = true'
        );
        $averageRating = null;
        if (($testimonialAgg['avg_rating'] ?? null) !== null && (float) $testimonialAgg['avg_rating'] > 0) {
            $averageRating = Support::number(round((float) $testimonialAgg['avg_rating'] * 10) / 10);
        }
        $testimonialTotal = (int) Db::val('SELECT COUNT(*) FROM testimonials');

        $blogPublished = (int) Db::val('SELECT COUNT(*) FROM blog_posts WHERE is_published = true');
        $blogTotal = (int) Db::val('SELECT COUNT(*) FROM blog_posts');
        $bookingTotal = (int) Db::val('SELECT COUNT(*) FROM bookings');
        $bookingPending = (int) Db::val("SELECT COUNT(*) FROM bookings WHERE status = 'pending'");
        $bookingConfirmed = (int) Db::val("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'");
        $bookingsMonth = Db::one(
            'SELECT COUNT(*) AS month_count, COALESCE(SUM(total_price), 0) AS revenue'
            . ' FROM bookings WHERE created_at >= ?',
            [$startOfMonth]
        );
        $contactTotal = (int) Db::val('SELECT COUNT(*) FROM contact_requests');
        $contactNew = (int) Db::val("SELECT COUNT(*) FROM contact_requests WHERE status = 'new'");
        $contactInProgress = (int) Db::val(
            "SELECT COUNT(*) FROM contact_requests WHERE status = 'in_progress'"
        );
        $mediaCount = (int) Db::val('SELECT COUNT(*) FROM media_library');
        $userCount = (int) Db::val('SELECT COUNT(*) FROM users');

        $stats = [
            'circuits' => [
                'total' => $circuitTotal,
                'active' => $circuitActive,
                'featured' => $circuitFeatured,
            ],
            'destinations' => ['total' => $destinationTotal, 'active' => $destinationActive],
            'categories' => ['total' => $categoryTotal, 'active' => $categoryActive],
            'testimonials' => [
                'total' => $testimonialTotal,
                'active' => (int) $testimonialAgg['active_count'],
                'averageRating' => $averageRating,
            ],
            'blog' => ['total' => $blogTotal, 'published' => $blogPublished],
            'bookings' => [
                'total' => $bookingTotal,
                'pending' => $bookingPending,
                'confirmed' => $bookingConfirmed,
                'thisMonth' => (int) $bookingsMonth['month_count'],
                'revenueThisMonth' => Support::number((float) $bookingsMonth['revenue']),
            ],
            'contactRequests' => [
                'total' => $contactTotal,
                'new' => $contactNew,
                'inProgress' => $contactInProgress,
            ],
            'mediaFiles' => ['total' => $mediaCount],
            'users' => ['total' => $userCount],
        ];

        $recentBookings = array_map(
            static fn (array $row): array => Serial::booking($row, ['title', 'slug']),
            Db::all(
                'SELECT t.*, c.title AS c_title, c.slug AS c_slug'
                . ' FROM bookings t LEFT JOIN circuits c ON c.id = t.circuit_id'
                . ' ORDER BY t.created_at DESC LIMIT 5'
            )
        );
        $recentContactRequests = array_map(
            static fn (array $row): array => Serial::contactRequest($row),
            Db::all('SELECT t.* FROM contact_requests t ORDER BY t.created_at DESC LIMIT 5')
        );

        Http::ok($stats + [
            'recentBookings' => $recentBookings,
            'recentContactRequests' => $recentContactRequests,
        ]);
    }
}
