<?php

declare(strict_types=1);

/**
 * Smoke test Phase A+B — tranche circuits + endpoints publics (outil dev uniquement).
 *
 * Démarre son propre serveur (`php -S` + router-dev.php), joue les
 * vérifications HTTP du contrat (docs/api.md) contre la base Aiven,
 * puis arrête le serveur. Les tokens JWT sont forgés localement depuis
 * config.local.php (aucun secret affiché).
 *
 * Usage : php scripts/smoke-circuits.php
 */

require __DIR__ . '/../lib/Env.php';
require __DIR__ . '/../lib/Jwt.php';
require __DIR__ . '/../lib/Auth.php';
require __DIR__ . '/../lib/Slug.php';
require __DIR__ . '/../lib/Db.php';

const PORT = 8099;
const BASE = 'http://127.0.0.1:' . PORT;

// ─────────────────────────────── Helpers ───────────────────────────────

$pass = 0;
$fail = 0;

function check(string $name, bool $ok, string $info = ''): void
{
    global $pass, $fail;
    if ($ok) {
        $pass++;
        echo "PASS  $name\n";
    } else {
        $fail++;
        echo 'FAIL  ', $name, ($info !== '' ? "  [$info]" : ''), "\n";
    }
}

/** @return array{0:int,1:mixed,2:string} [statut HTTP, JSON décodé, corps brut] */
function req(string $method, string $path, ?array $json = null, ?string $cookie = null): array
{
    $headers = [];
    if ($json !== null) {
        $headers[] = 'Content-Type: application/json';
    }
    if ($cookie !== null) {
        $headers[] = 'Cookie: wt_session=' . $cookie;
    }
    $opts = ['http' => [
        'method' => $method,
        'ignore_errors' => true,
        'timeout' => 30,
        'header' => implode("\r\n", $headers),
    ]];
    if ($json !== null) {
        $opts['http']['content'] = json_encode(
            $json,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
        );
    }
    $raw = @file_get_contents(BASE . $path, false, stream_context_create($opts));
    if ($raw === false) {
        return [0, null, ''];
    }
    $status = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#', $header, $m) === 1) {
            $status = (int) $m[1];
        }
    }
    return [$status, json_decode($raw, true), $raw];
}

function tail(string $file): string
{
    return implode('', array_slice(@file($file) ?: [], -15));
}

// ─────────────────────────────── Serveur de dev ───────────────────────────────

$logFile = sys_get_temp_dir() . '/wt-php-api-smoke.log';
@unlink($logFile);
$server = proc_open(
    [PHP_BINARY, '-S', '127.0.0.1:' . PORT, 'router-dev.php'],
    [1 => ['file', $logFile, 'a'], 2 => ['file', $logFile, 'a']],
    $pipes,
    dirname(__DIR__)
);
if (!is_resource($server)) {
    fwrite(STDERR, "Impossible de lancer php -S\n");
    exit(1);
}
register_shutdown_function(static function () use ($server): void {
    proc_terminate($server);
    proc_close($server);
});

$up = false;
for ($i = 0; $i < 60 && !$up; $i++) {
    $raw = @file_get_contents(
        BASE . '/api/inexistant',
        false,
        stream_context_create(['http' => ['method' => 'GET', 'timeout' => 5, 'ignore_errors' => true]])
    );
    if ($raw !== false) {
        $up = true;
        break;
    }
    usleep(200_000);
}
if (!$up) {
    fwrite(STDERR, "Serveur php -S injoignable — journal :\n" . tail($logFile) . "\n");
    exit(1);
}

// ─────────────────────────────── Tokens + données de seed ───────────────────────────────

$admin = WT\Auth::issueToken([
    'id' => WT\Db::uuid(),
    'email' => 'dev-admin@wondertours.test',
    'role' => 'admin',
    'name' => 'Dev Admin',
]);
$viewer = WT\Auth::issueToken([
    'id' => WT\Db::uuid(),
    'email' => 'dev-viewer@wondertours.test',
    'role' => 'viewer',
    'name' => 'Dev Viewer',
]);

$destinationSlug = WT\Db::val(
    'SELECT slug FROM destinations WHERE is_active = true ORDER BY created_at LIMIT 1'
);
$categoryRows = WT\Db::all('SELECT id, slug FROM categories ORDER BY sort_order, name LIMIT 2');
$categoryIds = array_column($categoryRows, 'id');

$createdId = null;
$currentSlug = null;

try {
    // ─────────────────────────────── Routage ───────────────────────────────
    echo "── Routage\n";
    [$s, $b] = req('GET', '/api/inexistant');
    check('404 route inconnue', $s === 404 && ($b['error'] ?? null) === 'Route introuvable', "status=$s");

    [$s, $b] = req('DELETE', '/api/circuits');
    check('405 méthode non autorisée', $s === 405 && ($b['error'] ?? null) === 'Méthode non autorisée', "status=$s");

    // ─────────────────────────────── Liste publique ───────────────────────────────
    echo "── Liste publique\n";
    [$s, $b] = req('GET', '/api/circuits');
    $envelopeOk = $s === 200 && is_array($b)
        && isset($b['items'], $b['total'], $b['page'], $b['pageSize'])
        && is_array($b['items']) && is_int($b['total'])
        && $b['page'] === 1 && $b['pageSize'] === 20;
    check('200 enveloppe {items,total,page,pageSize}', $envelopeOk, "status=$s");

    $first = $b['items'][0] ?? null;
    $seedSlug = $first['slug'] ?? null;
    if ($first !== null) {
        $shapeOk = isset($first['id'], $first['slug'], $first['title'], $first['price'], $first['createdAt'])
            && is_string($first['price'])
            && $first['isActive'] === true
            && array_key_exists('destination', $first)
            && isset($first['categories']) && is_array($first['categories'])
            && !array_key_exists('category', $first)
            && !array_key_exists('categoryId', $first)
            && preg_match('#^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$#', $first['createdAt']) === 1;
        check('item : camelCase, price chaîne, destination, categories[] (m-n)', $shapeOk,
            implode(',', array_keys($first)));
    }

    [, $b] = req('GET', '/api/circuits?pageSize=5');
    check('pageSize echo (défauts pagination)', ($b['pageSize'] ?? null) === 5);

    // ─────────────────────────────── Validation query ───────────────────────────────
    echo "── Validation des query params\n";
    foreach (['page=0', 'q=', 'featured=peutetre', 'maxPrice=abc', 'maxDuration=1.5'] as $qs) {
        [$s, $b] = req('GET', '/api/circuits?' . $qs);
        check("400 Paramètres invalides ($qs)",
            $s === 400
            && ($b['error'] ?? null) === 'Paramètres invalides'
            && isset($b['details']) && is_array($b['details']),
            "status=$s");
    }

    // ─────────────────────────────── Filtres ───────────────────────────────
    echo "── Filtres\n";
    [, $b] = req('GET', '/api/circuits?featured=true');
    $featuredOk = is_array($b)
        && array_filter($b['items'] ?? [], static fn (array $i): bool => $i['isFeatured'] !== true) === [];
    check('featured=true ne renvoie que des mis en avant', $featuredOk);

    [, $b] = req('GET', '/api/circuits?q=zzqqinexistant');
    check('q sans correspondance → total 0', is_array($b) && ($b['total'] ?? null) === 0);

    [$s, $b] = req('GET', '/api/circuits?maxPrice=99999999&maxDuration=365');
    check('maxPrice/maxDuration → 200', $s === 200 && is_array($b) && isset($b['items']), "status=$s");

    if ($destinationSlug !== null) {
        [, $b] = req('GET', '/api/circuits?destination=' . rawurlencode((string) $destinationSlug));
        $destOk = is_array($b)
            && array_filter(
                $b['items'],
                static fn (array $i): bool => ($i['destination']['slug'] ?? null) !== $destinationSlug
            ) === [];
        check("destination=$destinationSlug filtre les items", $destOk);
    }

    if ($categoryRows !== []) {
        $catSlug = $categoryRows[0]['slug'];
        [, $b] = req('GET', '/api/circuits?category=' . rawurlencode((string) $catSlug));
        $catOk = is_array($b)
            && array_filter(
                $b['items'],
                static fn (array $i): bool => !in_array(
                    $catSlug,
                    array_column($i['categories'] ?? [], 'slug'),
                    true
                )
            ) === [];
        check("category=$catSlug filtre les items (m-n)", $catOk);
    }

    // ─────────────────────────────── Public [slug] ───────────────────────────────
    echo "── Public [slug]\n";
    if ($seedSlug !== null) {
        [$s, $b] = req('GET', '/api/circuits/' . rawurlencode($seedSlug));
        check('200 [slug] seed avec relations',
            $s === 200 && ($b['slug'] ?? null) === $seedSlug && isset($b['destination'], $b['categories']),
            "status=$s");
    }
    [$s, $b] = req('GET', '/api/circuits/zz-slug-inexistant');
    check('404 slug inconnu', $s === 404 && ($b['error'] ?? null) === 'Circuit introuvable', "status=$s");

    // ─────────────────────────────── Endpoints publics (Phase B) ───────────────────────────────
    echo "── Endpoints publics Phase B\n";
    foreach (['destinations', 'categories', 'services'] as $path) {
        [$s, $b] = req('GET', '/api/' . $path);
        $listOk = $s === 200 && is_array($b)
            && isset($b['items'], $b['total'], $b['page'], $b['pageSize'])
            && is_array($b['items'])
            && ($b['items'] === [] || ($b['items'][0]['isActive'] ?? null) === true);
        check("200 GET /api/$path — enveloppe, actifs uniquement", $listOk, "status=$s");
    }

    [, $b] = req('GET', '/api/destinations?q=' . rawurlencode('zzqqinexistant'));
    check('destinations q sans correspondance → total 0', ($b['total'] ?? null) === 0);

    [$s, $b] = req('GET', '/api/destinations?page=0');
    check('400 destinations page=0',
        $s === 400 && ($b['error'] ?? null) === 'Paramètres invalides', "status=$s");

    [$s, $b] = req('GET', '/api/testimonials?featured=true');
    $featOk = $s === 200 && is_array($b)
        && array_filter($b['items'] ?? [], static fn (array $i): bool => $i['isFeatured'] !== true) === [];
    check('200 testimonials featured=true', $featOk, "status=$s");

    [$s, $b] = req('GET', '/api/blog');
    $blogOk = $s === 200 && is_array($b) && isset($b['items'], $b['total']);
    check('200 GET /api/blog — enveloppe', $blogOk, "status=$s");

    $firstPost = $b['items'][0] ?? null;
    if ($firstPost !== null) {
        $authorOk = ($firstPost['author'] ?? null) === null
            || !array_key_exists('passwordHash', $firstPost['author']);
        $postShapeOk = isset($firstPost['id'], $firstPost['slug'], $firstPost['views'])
            && array_key_exists('category', $firstPost)
            && array_key_exists('author', $firstPost)
            && ($firstPost['isPublished'] ?? null) === true
            && $authorOk;
        check('blog item : category + author (sans passwordHash), publié', $postShapeOk,
            implode(',', array_keys($firstPost)));
    }

    [, $b] = req('GET', '/api/blog?q=' . rawurlencode('zzqqinexistant'));
    check('blog q sans correspondance → total 0', ($b['total'] ?? null) === 0);

    $blogCatSlug = WT\Db::val(
        'SELECT bc.slug FROM blog_posts bp'
        . ' JOIN blog_categories bc ON bc.id = bp.category_id'
        . ' WHERE bp.is_published = true LIMIT 1'
    );
    if ($blogCatSlug !== null) {
        [, $b] = req('GET', '/api/blog?category=' . rawurlencode((string) $blogCatSlug));
        $blogCatOk = is_array($b)
            && ($b['total'] ?? 0) > 0
            && array_filter(
                $b['items'] ?? [],
                static fn (array $i): bool => ($i['category']['slug'] ?? null) !== $blogCatSlug
            ) === [];
        check("blog category=$blogCatSlug filtre les items", $blogCatOk);
    }

    $postSlug = WT\Db::val(
        'SELECT slug FROM blog_posts WHERE is_published = true ORDER BY published_at DESC LIMIT 1'
    );
    if ($postSlug !== null) {
        [$s, $b] = req('GET', '/api/blog/' . rawurlencode((string) $postSlug));
        $views1 = $b['views'] ?? null;
        // category/author peuvent être null (LEFT JOIN) — présents comme clés.
        check('200 blog/[slug] publié (views avant incrément)',
            $s === 200 && ($b['slug'] ?? null) === $postSlug
            && is_int($views1)
            && array_key_exists('category', $b) && array_key_exists('author', $b),
            "status=$s");

        [, $b] = req('GET', '/api/blog/' . rawurlencode((string) $postSlug));
        check('blog/[slug] views +1 à la lecture suivante',
            ($b['views'] ?? null) === $views1 + 1,
            ($b['views'] ?? '?') . ' vs ' . ($views1 + 1));
    }

    [$s, $b] = req('GET', '/api/blog/zz-slug-inexistant');
    check('404 blog/[slug] inconnu', $s === 404 && ($b['error'] ?? null) === 'Article introuvable', "status=$s");

    [$s, $b] = req('POST', '/api/contact', [
        'name' => 'Test PHP Smoke',
        'email' => 'test-php@wondertours.test',
        'requestType' => 'sejour',
        'travelDate' => '',
        'travelers' => 3,
        'message' => 'Message de test smoke PHP — sera supprimé.',
    ]);
    $contactOk = $s === 201
        && ($b['message'] ?? null) === 'Demande envoyée avec succès'
        && isset($b['id']);
    check('201 POST /api/contact (sejour→stay, travelDate vide)', $contactOk,
        'status=' . $s . ' ' . substr(json_encode($b) ?: '', 0, 200));
    if (isset($b['id'])) {
        $row = WT\Db::one(
            'SELECT request_type, travel_date, travelers, status FROM contact_requests WHERE id = ?',
            [$b['id']]
        );
        // Les clés du SELECT existent toujours — comparaison directe à null
        // (?? renverrait 'x' précisément quand la valeur est null).
        check('contact en base : request_type=stay, travel_date NULL, status new',
            ($row['request_type'] ?? null) === 'stay'
            && $row['travel_date'] === null
            && (int) ($row['travelers'] ?? 0) === 3
            && ($row['status'] ?? null) === 'new',
            json_encode($row) ?: '');
    }

    [$s, $b] = req('POST', '/api/contact', ['name' => 'x', 'email' => 'pas-un-email', 'message' => 'court']);
    check('400 POST /api/contact corps invalide',
        $s === 400 && ($b['error'] ?? null) === 'Données invalides' && isset($b['details']),
        "status=$s");

    $seedCircuit = WT\Db::one(
        'SELECT id, price FROM circuits WHERE is_active = true ORDER BY created_at LIMIT 1'
    );
    if ($seedCircuit !== null) {
        [$s, $b] = req('POST', '/api/bookings', [
            'circuitId' => $seedCircuit['id'],
            'name' => 'Test PHP Smoke',
            'email' => 'test-php@wondertours.test',
            'participants' => 2,
            'travelDate' => '2026-12-15',
            'notes' => '',
        ]);
        $expectedTotal = (float) $seedCircuit['price'] * 2;
        $bookingOk = $s === 201
            && ($b['message'] ?? null) === 'Réservation enregistrée avec succès'
            && is_string($b['bookingReference'] ?? null)
            && preg_match('#^WT-[0-9A-Z]{6}$#', $b['bookingReference']) === 1
            && is_string($b['totalPrice'] ?? null)
            && abs((float) $b['totalPrice'] - $expectedTotal) < 0.001
            && ($b['currency'] ?? null) === 'XOF'
            && ($b['status'] ?? null) === 'pending';
        check('201 POST /api/bookings (prix×participants, WT-XXXXXX)', $bookingOk,
            'status=' . $s . ' ' . substr(json_encode($b) ?: '', 0, 200));
        if (isset($b['id'])) {
            $row = WT\Db::one(
                'SELECT type, travel_date, notes FROM bookings WHERE id = ?',
                [$b['id']]
            );
            check('booking en base : type circuit, travel_date, notes NULL',
                ($row['type'] ?? null) === 'circuit'
                && ($row['travel_date'] ?? null) === '2026-12-15'
                && $row['notes'] === null,
                json_encode($row) ?: '');
        }
    }

    [$s, $b] = req('POST', '/api/bookings', [
        'circuitId' => WT\Db::uuid(),
        'name' => 'Test PHP Smoke',
        'email' => 'test-php@wondertours.test',
    ]);
    check('400 bookings circuit inexistant',
        $s === 400 && ($b['error'] ?? null) === 'Circuit invalide ou introuvable', "status=$s");

    [$s, $b] = req('POST', '/api/bookings', [
        'name' => 'Sans Circuit',
        'email' => 'test-php@wondertours.test',
        'type' => 'stay',
    ]);
    $noCircuitOk = $s === 201
        && array_key_exists('totalPrice', $b) && $b['totalPrice'] === null
        && is_string($b['bookingReference'] ?? null);
    check('201 bookings sans circuit (totalPrice null, type stay)', $noCircuitOk,
        'status=' . $s . ' ' . substr(json_encode($b) ?: '', 0, 200));

    [$s] = req('POST', '/api/bookings', [
        'name' => 'Test PHP Smoke',
        'email' => 'test-php@wondertours.test',
        'participants' => 0,
    ]);
    check('400 bookings participants=0', $s === 400, "status=$s");

    // ─────────────────────────────── Garde session ───────────────────────────────
    echo "── Garde session\n";
    [$s, $b] = req('GET', '/api/dashboard/circuits');
    check('401 sans cookie', $s === 401 && ($b['error'] ?? null) === 'Authentification requise', "status=$s");

    [$s] = req('GET', '/api/dashboard/circuits', null, 'pas-un-jwt');
    check('401 cookie invalide', $s === 401, "status=$s");

    [$s, $b] = req('GET', '/api/dashboard/circuits', null, $viewer);
    check('200 viewer sur la liste', $s === 200 && isset($b['items'], $b['total']), "status=$s");

    // ─────────────────────────────── CRUD dashboard ───────────────────────────────
    echo "── CRUD dashboard\n";
    $rand = bin2hex(random_bytes(4));
    $title = "Circuit Test PHP $rand";
    $newTitle = "Circuit Test PHP Renomme $rand";
    $catIds = array_slice($categoryIds, 0, 2);

    $createBody = [
        'title' => $title,
        'price' => 123.45,
        'durationDays' => 2,
        'gallery' => ['https://example.com/a.jpg'],
        'itinerary' => [['day' => 1, 'title' => 'Jour 1', 'description' => 'Arrivée']],
    ];
    if ($catIds !== []) {
        $createBody['categoryIds'] = $catIds;
    }

    // Attendu calculé AVANT le POST (la ligne existerait sinon → suffixe -2).
    $expectedCreateSlug = WT\Slug::uniqueSlug('circuit', $title);
    [$s, $b] = req('POST', '/api/dashboard/circuits', $createBody, $admin);
    $createOk = $s === 201
        && isset($b['id'], $b['slug'], $b['createdAt'], $b['updatedAt'])
        && $b['title'] === $title
        && $b['price'] === '123.45'
        && $b['currency'] === 'XOF'
        && $b['isActive'] === true
        && $b['isFeatured'] === false
        && $b['durationDays'] === 2
        && ($b['gallery'] ?? null) === ['https://example.com/a.jpg']
        && ($b['itinerary'][0]['title'] ?? null) === 'Jour 1'
        && !array_key_exists('destination', $b)
        && !array_key_exists('categories', $b);
    check('201 création — ligne brute Prisma (défauts, json, sans relations)', $createOk,
        'status=' . $s . ' ' . substr(json_encode($b) ?: '', 0, 300));

    $createdId = $b['id'] ?? null;
    $currentSlug = $b['slug'] ?? null;
    if ($createdId !== null) {
        check('slug généré = uniqueSlug(slugify(title))', $currentSlug === $expectedCreateSlug,
            ($currentSlug ?? '?') . " vs $expectedCreateSlug");
    }

    if ($createdId !== null) {
        [$s, $b] = req('GET', '/api/dashboard/circuits/' . $createdId, null, $admin);
        check('200 GET /[id] avec relations',
            $s === 200 && ($b['id'] ?? null) === $createdId
            && array_key_exists('destination', $b) && is_array($b['categories'] ?? null),
            "status=$s");

        $got = array_column($b['categories'] ?? [], 'id');
        sort($got);
        $expect = $catIds;
        sort($expect);
        check('categories m-n connectées sur GET', $got === $expect, implode(',', $got));

        [$s, $b] = req('GET', '/api/circuits/' . rawurlencode((string) $currentSlug));
        check('200 public [slug] du circuit créé', $s === 200 && isset($b['categories']), "status=$s");

        [, $b] = req('GET', '/api/circuits?pageSize=100');
        check('circuit créé visible dans la liste publique',
            in_array($createdId, array_column($b['items'] ?? [], 'id'), true));
    }

    [$s, $b] = req('POST', '/api/dashboard/circuits', [
        'title' => "Circuit Test PHP P2025 $rand",
        'price' => 1,
        'categoryIds' => [WT\Db::uuid()],
    ], $admin);
    check('404 connect sur catégorie inexistante (P2025)',
        $s === 404 && ($b['error'] ?? null) === 'Ressource introuvable', "status=$s");

    [$s, $b] = req('POST', '/api/dashboard/circuits', ['title' => 'ab', 'price' => -5], $admin);
    check('400 Données invalides + details',
        $s === 400 && ($b['error'] ?? null) === 'Données invalides'
        && isset($b['details']) && is_array($b['details']) && count($b['details']) >= 2,
        "status=$s");

    if ($createdId !== null) {
        $patchBody = ['title' => $newTitle, 'isFeatured' => true];
        if ($catIds !== []) {
            $patchBody['categoryIds'] = [$catIds[0]];
        }
        [$s, $b] = req('PATCH', '/api/dashboard/circuits/' . $createdId, $patchBody, $admin);
        $expectedSlug = WT\Slug::uniqueSlug('circuit', $newTitle, $createdId);
        $patchOk = $s === 200
            && ($b['title'] ?? null) === $newTitle
            && ($b['slug'] ?? null) === $expectedSlug
            && ($b['isFeatured'] ?? null) === true
            && !array_key_exists('categories', $b);
        check('200 PATCH — slug régénéré, ligne brute', $patchOk,
            'status=' . $s . ' slug=' . ($b['slug'] ?? '?') . " vs $expectedSlug");
        $currentSlug = ($b['slug'] ?? $currentSlug);

        if ($catIds !== []) {
            [, $b] = req('GET', '/api/dashboard/circuits/' . $createdId, null, $admin);
            $got = array_column($b['categories'] ?? [], 'id');
            check('PATCH categoryIds → set (1 catégorie)', $got === [$catIds[0]], implode(',', $got));
        }

        [$s, $b] = req('PATCH', '/api/dashboard/circuits/' . $createdId, [], $admin);
        check('200 PATCH corps vide (updatedAt seul)', $s === 200 && isset($b['id'], $b['updatedAt']), "status=$s");

        [$s] = req('PATCH', '/api/dashboard/circuits/' . $createdId, ['categoryIds' => null], $admin);
        check('200 PATCH categoryIds=null (divergence Next 500)', $s === 200, "status=$s");
        [, $b] = req('GET', '/api/dashboard/circuits/' . $createdId, null, $admin);
        check('categories retirées par categoryIds=null', ($b['categories'] ?? null) === []);

        [$s] = req('PATCH', '/api/dashboard/circuits/' . $createdId, ['categoryIds' => [WT\Db::uuid()]], $admin);
        check('404 PATCH set sur catégorie inexistante (P2025)', $s === 404, "status=$s");

        [$s, $b] = req('GET', '/api/dashboard/circuits/pas-un-uuid', null, $admin);
        check('404 id non-UUID', $s === 404 && ($b['error'] ?? null) === 'Circuit introuvable', "status=$s");

        [$s, $b] = req('POST', '/api/dashboard/circuits', $createBody, $viewer);
        check('403 viewer sur POST', $s === 403 && ($b['error'] ?? null) === 'Accès refusé', "status=$s");

        [$s, $b] = req('PATCH', '/api/dashboard/circuits/' . $createdId, ['isFeatured' => false], $viewer);
        check('403 viewer sur PATCH', $s === 403 && ($b['error'] ?? null) === 'Accès refusé', "status=$s");

        [$s, $b] = req('DELETE', '/api/dashboard/circuits/' . $createdId, null, $admin);
        check('200 DELETE {message,id}',
            $s === 200 && ($b['message'] ?? null) === 'Circuit supprimé' && ($b['id'] ?? null) === $createdId,
            "status=$s");

        [$s, $b] = req('DELETE', '/api/dashboard/circuits/' . $createdId, null, $admin);
        check('404 DELETE répété (pré-lecture)',
            $s === 404 && ($b['error'] ?? null) === 'Circuit introuvable', "status=$s");

        [$s, $b] = req('GET', '/api/circuits/' . rawurlencode((string) $currentSlug));
        check('404 public [slug] après suppression',
            $s === 404 && ($b['error'] ?? null) === 'Circuit introuvable', "status=$s");
    }
} finally {
    // Nettoyage de sûreté : réservations/demandes de test (email dédié au
    // smoke), puis la ligne de circuit si un échec a interrompu le cycle.
    WT\Db::run('DELETE FROM bookings WHERE customer_email = ?', ['test-php@wondertours.test']);
    WT\Db::run('DELETE FROM contact_requests WHERE email = ?', ['test-php@wondertours.test']);
    if ($createdId !== null
        && WT\Db::one('SELECT id FROM circuits WHERE id = ?', [$createdId]) !== null) {
        WT\Db::run('DELETE FROM circuits WHERE id = ?', [$createdId]);
        echo "— nettoyage : circuit de test supprimé directement en base\n";
    }
}

echo "── Résumé : $pass PASS, $fail FAIL\n";
exit($fail === 0 ? 0 : 1);
