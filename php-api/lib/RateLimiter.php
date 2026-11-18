<?php

declare(strict_types=1);

namespace WT;

/**
 * Rate limiting simple par adresse IP + endpoint, sans dépendance externe.
 *
 * Stocke les horodatages des tentatives dans un fichier JSON par clé
 * (ip:endpoint) dans le répertoire temporaire du système.
 * Fenêtre glissante : max N requêtes par fenêtre de T secondes.
 *
 * Usage :
 *   $rl = new RateLimiter('login', 10, 900); // 10 requêtes / 15 min
 *   if (!$rl->check($ip)) { Http::tooManyRequests(...); }
 *
 * Ne lève jamais d'exception bloquante : en cas d'erreur de lecture/écriture
 * du fichier, le passage est autorisé (dégradation gracieuse, jamais de blocage
 * légitime).
 */
final class RateLimiter
{
    private string $endpoint;
    private int $max;
    private int $windowSeconds;
    private string $dir;

    public function __construct(string $endpoint, int $max = 10, int $windowSeconds = 900)
    {
        $this->endpoint = $endpoint;
        $this->max = $max;
        $this->windowSeconds = $windowSeconds;
        $this->dir = sys_get_temp_dir() . '/wt_ratelimit';
        if (!is_dir($this->dir) && !@mkdir($this->dir, 0700, true) && !is_dir($this->dir)) {
            $this->dir = ''; // désactivé si le répertoire n'est pas utilisable
        }
    }

    private function filePath(string $ip): string
    {
        return $this->dir . '/' . $this->endpoint . '_' . preg_replace('/[^a-zA-Z0-9]/', '_', $ip) . '.json';
    }

    /** Retourne true si la requête est autorisée (sous le seuil), false sinon. */
    public function check(string $ip): bool
    {
        if ($this->dir === '') {
            return true;
        }
        $path = $this->filePath($ip);
        $now = time();
        $attempts = [];
        if (is_file($path)) {
            $raw = @file_get_contents($path);
            $decoded = $raw !== false ? json_decode((string) $raw, true) : null;
            if (is_array($decoded)) {
                foreach ($decoded as $ts) {
                    if (is_numeric($ts) && $now - (float) $ts < $this->windowSeconds) {
                        $attempts[] = (float) $ts;
                    }
                }
            }
        }
        if (count($attempts) >= $this->max) {
            return false;
        }
        $attempts[] = $now;
        @file_put_contents($path, json_encode($attempts));
        @chmod($path, 0600);
        return true;
    }
}
