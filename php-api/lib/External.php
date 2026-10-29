<?php

declare(strict_types=1);

namespace WT;

/**
 * Intégrations externes via cURL — équivalents de lib/services/{mailer,deepl,imgbb}.ts :
 *   - Resend : envoi d'emails, dégradation gracieuse sans RESEND_API_KEY
 *     (sendEmailSafe n'échoue jamais — best effort, jamais bloquant) ;
 *   - DeepL : traduction (clé « :fx » → API free), lève en cas d'échec
 *     (500 via le front controller, comme deepl-node côté Next) ;
 *   - imgBB : upload d'images (storagePath = delete_url, pas d'API de suppression).
 *
 * Les URLs publiques sont basées sur app_url (liens des emails, dashboard).
 */
final class External
{
    private const RESEND_URL = 'https://api.resend.com/emails';
    private const IMGBB_URL = 'https://api.imgbb.com/1/upload';

    // ─────────────────────────────── Configuration ───────────────────────────────

    /** Expéditeur (MAIL_FROM) — défaut identique à mailer.ts. */
    public static function getMailFrom(): string
    {
        return Env::get('mail_from') ?? 'Wonder Tours <onboarding@resend.dev>';
    }

    /** Destinataires des notifications internes (MAIL_TEAM_EMAIL, séparées par des virgules). */
    public static function getTeamEmails(): array
    {
        $raw = Env::get('mail_team_email') ?? 'contact@wondertoursandservices.com';
        $emails = array_map('trim', explode(',', $raw));
        return array_values(array_filter($emails, static fn (string $email): bool => $email !== ''));
    }

    /** URL publique du site, base des liens insérés dans les emails. */
    public static function getAppUrl(): string
    {
        return rtrim(Env::get('app_url') ?? 'https://wondertoursandservices.com', '/');
    }

    // ─────────────────────────────── Resend ───────────────────────────────

    /**
     * Envoie un email via Resend. Sans resend_api_key : ignoré (skipped).
     * Les erreurs Resend ne lèvent pas — retour au format {sent, skipped, error?}.
     *
     * @param array{to: string|array<int, string>, subject: string, html: string, replyTo?: string} $input
     * @return array{sent: bool, skipped: bool, error?: string}
     */
    public static function sendEmail(array $input): array
    {
        if (!Env::has('resend_api_key')) {
            error_log('[mail] resend_api_key absente — email non envoyé : ' . $input['subject']);
            return ['sent' => false, 'skipped' => true];
        }

        $to = is_array($input['to']) ? array_values($input['to']) : [$input['to']];
        $payload = [
            'from' => self::getMailFrom(),
            'to' => $to,
            'subject' => $input['subject'],
            'html' => $input['html'],
        ];
        if (!empty($input['replyTo'])) {
            $payload['reply_to'] = $input['replyTo'];
        }

        try {
            [$status, $body] = self::postJson(
                self::RESEND_URL,
                $payload,
                ['Authorization: Bearer ' . Env::require('resend_api_key')]
            );
        } catch (\Throwable $e) {
            error_log('[mail] Exception pendant l\'envoi : ' . $e->getMessage());
            return ['sent' => false, 'skipped' => false, 'error' => $e->getMessage()];
        }

        $decoded = is_array($body) ? $body : [];
        if ($status >= 400 || isset($decoded['error'])) {
            $error = is_array($decoded['error'] ?? null) ? (string) ($decoded['error']['message'] ?? '') : 'HTTP ' . $status;
            error_log("[mail] Échec de l'envoi Resend : $error");
            return ['sent' => false, 'skipped' => false, 'error' => $error];
        }
        if (isset($decoded['data']['id'])) {
            error_log('[mail] Email envoyé (id ' . $decoded['data']['id'] . ') : ' . $input['subject']);
        }
        return ['sent' => true, 'skipped' => false];
    }

    /**
     * Variante « best effort » : n'échoue JAMAIS — pour les confirmations et
     * notifications annexes (contact, réservation, création de compte…).
     *
     * @param array{to: string|array<int, string>, subject: string, html: string, replyTo?: string} $input
     */
    public static function sendEmailSafe(array $input): void
    {
        try {
            self::sendEmail($input);
        } catch (\Throwable) {
            // ignoré — jamais bloquant pour la requête appelante
        }
    }

    // ─────────────────────────────── DeepL ───────────────────────────────

    public static function isDeeplConfigured(): bool
    {
        return Env::has('deepl_api_key');
    }

    /**
     * Traduit plusieurs textes en une seule requête (POST /v2/translate).
     * Lève RuntimeException en cas d'échec réseau/API — le front controller
     * renvoie alors 500, comme le throw deepl-node côté Next.
     *
     * @param array<int, string> $texts
     * @param array<int, string> textes traduits, dans l'ordre
     */
    public static function translateTexts(array $texts, string $targetLang, ?string $sourceLang = null): array
    {
        $key = Env::require('deepl_api_key');
        // deepl-node : clé suffixée « :fx » → API free (la clé est passée sans suffixe).
        $host = str_ends_with($key, ':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';

        $payload = ['text' => array_values($texts), 'target_lang' => $targetLang];
        if ($sourceLang !== null) {
            $payload['source_lang'] = $sourceLang;
        }

        [$status, $body] = self::postJson(
            $host . '/v2/translate',
            $payload,
            ['Authorization: DeepL-Auth-Key ' . $key]
        );

        $translations = is_array($body) ? ($body['translations'] ?? null) : null;
        if ($status >= 400 || !is_array($translations)) {
            $message = is_array($body) && isset($body['message']) ? (string) $body['message'] : 'HTTP ' . $status;
            throw new \RuntimeException("DeepL a refusé la traduction : $message");
        }

        $out = [];
        foreach ($translations as $translation) {
            $out[] = (string) ($translation['text'] ?? '');
        }
        return $out;
    }

    // ─────────────────────────────── imgBB ───────────────────────────────

    public static function isImgbbConfigured(): bool
    {
        return Env::has('imgbb_api_key');
    }

    /**
     * Téléverse le fichier sur imgBB.
     *
     * @return array{url: string, deleteUrl: string}
     * @throws \RuntimeException échec réseau, clé invalide ou réponse inattendue
     */
    public static function uploadToImgbb(string $tmpPath, string $filename): array
    {
        $key = Env::require('imgbb_api_key');

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => self::IMGBB_URL,
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_POSTFIELDS => [
                'key' => $key,
                'image' => new \CURLFile($tmpPath, mime_content_type($tmpPath) ?: 'application/octet-stream', $filename),
            ],
        ]);
        $raw = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($raw === false) {
            throw new \RuntimeException("Échec de la requête imgBB : $error");
        }

        $body = json_decode((string) $raw, true);
        if (!is_array($body)) {
            throw new \RuntimeException("Réponse imgBB illisible (HTTP $status)");
        }
        if ($status >= 400 || empty($body['success'])) {
            $message = is_array($body['error'] ?? null) ? (string) ($body['error']['message'] ?? '') : "HTTP $status";
            throw new \RuntimeException("imgBB a refusé l'upload : $message");
        }

        $data = is_array($body['data'] ?? null) ? $body['data'] : [];
        $url = $data['display_url'] ?? ($data['image']['url'] ?? null);
        $deleteUrl = $data['delete_url'] ?? null;
        if (!is_string($url) || $url === '' || !is_string($deleteUrl) || $deleteUrl === '') {
            throw new \RuntimeException('Réponse imgBB incomplète (url ou delete_url manquante)');
        }

        return ['url' => $url, 'deleteUrl' => $deleteUrl];
    }

    // ─────────────────────────────── Internes ───────────────────────────────

    /**
     * POST JSON décodé — retourne [statut HTTP, corps décodé (array|null)].
     *
     * @param array<int, string> $headers en-têtes HTTP additionnels
     * @return array{0: int, 1: array|null}
     */
    private static function postJson(string $url, array $payload, array $headers): array
    {
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        ]);
        $raw = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        if ($raw === false) {
            $error = curl_error($curl);
            curl_close($curl);
            throw new \RuntimeException("Échec de la requête HTTP : $error");
        }
        curl_close($curl);

        return [$status, json_decode((string) $raw, true)];
    }

    // ─────────────────────────────── GitHub (rebuild on demand) ───────────────────────────────

    /**
     * Déclenche un rebuild du site via l'API GitHub (repository_dispatch).
     * Best-effort : n'échoue jamais, n'est jamais bloquant pour la requête appelante.
     * Debounce : au plus un déclenchement toutes les 5 minutes (fichier temporaire).
     *
     * @param bool $force ignore le debounce (bouton « Publier » manuel)
     */
    public static function triggerRebuild(bool $force = false): void
    {
        $token = Env::get('github_token') ?? Env::get('github_dispatch_token');
        if ($token === null || $token === '') {
            return; // pas de token configuré : déclenchement désactivé
        }

        $repo = Env::get('github_repo') ?? 'codertobi77/wondertours';
        $branch = Env::get('github_branch') ?? 'master';

        $stampFile = sys_get_temp_dir() . '/wt_rebuild_last';
        if (!$force && is_file($stampFile)) {
            $last = (int) @file_get_contents($stampFile);
            if ($last > 0 && (time() - $last) < 300) {
                return;
            }
        }

        try {
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => 'https://api.github.com/repos/' . $repo . '/dispatches',
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Accept: application/vnd.github+json',
                    'Authorization: Bearer ' . $token,
                    'X-GitHub-Api-Version: 2022-11-28',
                    'User-Agent: WonderTours-PHP',
                ],
                CURLOPT_POSTFIELDS => json_encode(
                    ['event_type' => 'content-updated', 'client_payload' => ['branch' => $branch]],
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                ),
            ]);
            $raw = curl_exec($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            curl_close($curl);

            if ($status >= 200 && $status < 300) {
                @file_put_contents($stampFile, (string) time());
                error_log('[publish] Rebuild déclenché (HTTP ' . $status . ')');
            } else {
                error_log('[publish] Échec du déclenchement (HTTP ' . $status . ') : ' . (string) $raw);
            }
        } catch (\Throwable $e) {
            error_log('[publish] Exception : ' . $e->getMessage());
        }
    }
}
