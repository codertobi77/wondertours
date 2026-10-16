<?php
/**
 * ──────────────────────────────────────────────────────────────────────
 * Test de faisabilité LWS Perso — connexion PostgreSQL distante (Aiven)
 * ──────────────────────────────────────────────────────────────────────
 * Contexte : migration du backend de wondertoursandservices.com vers PHP
 * sur un hébergement LWS « Perso » (LWS Panel, sans SSH). Ce script vérifie
 * depuis l'hébergement lui-même ce que la documentation LWS ne confirme
 * pas :
 *
 *   1. PHP ≥ 8.1 et extension pdo_pgsql disponibles
 *   2. Sortie réseau TCP autorisée vers Aiven (port 12733)
 *   3. Connexion TLS PostgreSQL et lecture d'une vraie table
 *
 * Utilisation :
 *   1. LWS Panel → gestionnaire de fichiers → dossier du domaine
 *      (public_html). Uploadez ce fichier.
 *   2. Modifiez ce fichier et collez l'URI Aiven dans la constante
 *      TEST_DATABASE_URL ci-dessous (ou créez à côté un fichier
 *      config.local.php : <?php return ['database_url' => 'postgres://…']; )
 *   3. Visitez https://<votre-domaine>/test-connexion.php
 *   4. Copiez/collez la page obtenue comme résultat du test.
 *
 * ⚠️ SUPPRIMEZ ce fichier (et config.local.php) immédiatement après le
 *    test : l'URI contient le mot de passe de la base.
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
header('Content-Type: text/plain; charset=utf-8');

/**
 * URI Aiven — SEULE valeur à modifier avant l'upload.
 * Exemple : postgres://avnadmin:motdepasse@pg-wondert-eaxi-project.h.aivencloud.com:12733/defaultdb?sslmode=require
 */
const TEST_DATABASE_URL = '';

// ─────────────────── Résolution de l'URI de connexion ───────────────────

$databaseUrl = TEST_DATABASE_URL;

if ($databaseUrl === '' && getenv('DATABASE_URL')) {
    $databaseUrl = getenv('DATABASE_URL');
}

if ($databaseUrl === '' && is_file(__DIR__ . '/config.local.php')) {
    $config = require __DIR__ . '/config.local.php';
    if (is_array($config) && !empty($config['database_url'])) {
        $databaseUrl = (string) $config['database_url'];
    }
}

echo "==== Test de faisabilite LWS Perso -> PostgreSQL Aiven ====\n";
echo 'PHP        : ' . PHP_VERSION . ' (' . php_sapi_name() . ")\n";
echo 'Date       : ' . date('c') . "\n";
echo 'Hote       : ' . php_uname('n') . "\n\n";

if ($databaseUrl === '') {
    echo "Aucune URI de base trouvee.\n\n";
    echo "Modifiez test-connexion.php : collez l'URI Aiven dans TEST_DATABASE_URL,\n";
    echo "ou creez a cote config.local.php contenant :\n";
    echo "  <?php return ['database_url' => 'postgres://…'];\n";
    exit(0);
}

/** Exécute une étape, affiche OK ou ÉCHEC, retourne le succès. */
function step(int $n, string $label, callable $fn)
{
    echo "[$n] $label : ";
    try {
        $result = $fn();
        echo 'OK';
        if (is_string($result) && $result !== '') {
            echo " — $result";
        }
        echo "\n";
        return true;
    } catch (Throwable $e) {
        echo 'ECHEC — ' . $e->getMessage() . "\n";
        return false;
    }
}

$ok = true;

// [1] Version PHP
$ok = step(1, 'Version PHP >= 8.1', function () {
    if (version_compare(PHP_VERSION, '8.1.0', '<')) {
        throw new RuntimeException(
            'PHP ' . PHP_VERSION . ' actif — selectionnez PHP 8.x dans LWS Panel'
            . ' (section PHP du panel) puis relancez ce test.'
        );
    }
    return PHP_VERSION;
}) && $ok;

// [2] Extension pdo_pgsql
$ok = step(2, 'Extension pdo_pgsql', function () {
    $drivers = PDO::getAvailableDrivers();
    if (!in_array('pgsql', $drivers, true)) {
        throw new RuntimeException(
            'pdo_pgsql absent. Drivers PDO disponibles : ' . implode(', ', $drivers)
        );
    }
    return 'presente';
}) && $ok;

// [3] Lecture de l'URI
$parts = parse_url($databaseUrl);
$ok = step(3, "Lecture de l'URI", function () use ($parts) {
    if ($parts === false || empty($parts['host']) || empty($parts['user'])) {
        throw new RuntimeException('URI illisible (schema://user:pass@host:port/base attendu)');
    }
    return $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
}) && $ok;

if (!$ok) {
    echo "\nArret : corrigez les points en echec ci-dessus puis relancez.\n";
    exit(0);
}

$host    = (string) $parts['host'];
$port    = isset($parts['port']) ? (int) $parts['port'] : 5432;
$dbname  = isset($parts['path']) ? ltrim($parts['path'], '/') : '';
$query   = [];
if (isset($parts['query'])) {
    parse_str($parts['query'], $query);
}
$sslmode = isset($query['sslmode']) ? (string) $query['sslmode'] : 'require';

// [4] Sortie TCP vers Aiven
$ok = step(4, "Sortie TCP vers $host:$port", function () use ($host, $port) {
    $socket = @fsockopen($host, $port, $errno, $errstr, 10);
    if ($socket === false) {
        throw new RuntimeException(
            "fsockopen a echoue ($errno) $errstr — la sortie reseau vers ce port"
            . ' est probablement bloquee par l\'hebergeur'
        );
    }
    fclose($socket);
    return 'connexion TCP ouverte';
}) && $ok;

// [5] + [6] Connexion PDO (TLS) puis lecture de la table users
$pdo = null;
if ($ok) {
    $ok = step(5, "Connexion PostgreSQL (PDO, sslmode=$sslmode)", function () use (&$pdo, $host, $port, $dbname, $parts, $sslmode) {
        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s;connect_timeout=15',
            $host,
            $port,
            $dbname !== '' ? $dbname : 'postgres',
            $sslmode
        );
        $pdo = new PDO(
            $dsn,
            rawurldecode((string) $parts['user']),
            isset($parts['pass']) ? rawurldecode((string) $parts['pass']) : '',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $version = $pdo->query('SELECT version()')->fetchColumn();
        return substr((string) $version, 0, 72) . '…';
    }) && $ok;
}

if ($ok && $pdo instanceof PDO) {
    $ok = step(6, 'Lecture de la table « users »', function () use ($pdo) {
        $count = $pdo->query('SELECT count(*) FROM users')->fetchColumn();
        return ((int) $count) . ' ligne(s)';
    }) && $ok;
}

// ──────────────────────────── Verdict ────────────────────────────

echo "\n";
if ($ok) {
    echo "==== RESULTAT : FAISABLE ====\n";
    echo "pdo_pgsql + sortie reseau + TLS : la migration PHP -> Aiven est\n";
    echo "possible sur cet hebergement. Le plan peut se derouler tel quel.\n";
} else {
    echo "==== RESULTAT : BLOQUE ====\n";
    echo "Transmettez cette page telle quelle. Selon l'etape en echec :\n";
    echo "- pdo_pgsql absent ou port bloque -> bascule prevue au plan :\n";
    echo "  MySQL local de l'offre Perso (Phase 0, plan B).\n";
}
echo "\nATTENTION : supprimez maintenant test-connexion.php et config.local.php\n";
echo "via le gestionnaire de fichiers (l'URI contient le mot de passe).\n";
