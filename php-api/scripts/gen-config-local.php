<?php

declare(strict_types=1);

/**
 * Génère php-api/config.local.php (gitignoré) à partir du .env Next.js :
 *   php php-api/scripts/gen-config-local.php
 *
 * Aucune valeur n'est affichée — seuls les clés migrées et le chemin cible
 * sont imprimés. Les clés non présentes (ex. DEEPL_API_KEY) sont omises :
 * les défauts de Env.php s'appliquent.
 */

$envPath = dirname(__DIR__, 2) . '/.env';
if (!is_file($envPath)) {
    fwrite(STDERR, "Fichier .env introuvable : $envPath\n");
    exit(1);
}

$mapping = [
    'DATABASE_URL' => 'database_url',
    'AUTH_SECRET' => 'auth_secret',
    'APP_URL' => 'app_url',
    'RESEND_API_KEY' => 'resend_api_key',
    'IMGBB_API_KEY' => 'imgbb_api_key',
    'DEEPL_API_KEY' => 'deepl_api_key',
    'SECURE_COOKIES' => 'secure_cookies',
];

$config = [];
foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
        continue;
    }
    [$key, $value] = explode('=', $line, 2);
    $key = trim($key);
    $value = trim($value);
    // Guillemets facultatifs (convention dotenv).
    if ($value !== '' && ($value[0] === '"' || $value[0] === "'") && str_ends_with($value, $value[0])) {
        $value = substr($value, 1, -1);
    }
    if (isset($mapping[$key]) && $value !== '') {
        $config[$mapping[$key]] = $value;
    }
}

if (!isset($config['database_url'], $config['auth_secret'])) {
    fwrite(STDERR, "DATABASE_URL et AUTH_SECRET sont requis dans .env\n");
    exit(1);
}

$target = dirname(__DIR__) . '/config.local.php';
$written = file_put_contents(
    $target,
    "<?php\n\n// Généré automatiquement — ne pas commiter (cf. .gitignore).\n\nreturn " . var_export($config, true) . ";\n"
);
if ($written === false) {
    fwrite(STDERR, "Écriture impossible : $target\n");
    exit(1);
}
chmod($target, 0600);

echo 'config.local.php généré (' . count($config) . ' clés : '
    . implode(', ', array_keys($config)) . ') — valeurs non affichées.', PHP_EOL;
