<?php

declare(strict_types=1);

namespace WT;

/**
 * Templates des emails du projet — équivalent PHP de lib/services/mail-templates.ts.
 * Fonctions pures {subject, html} : les données fournies par l'utilisateur sont
 * échappées via escapeHtml, exactement comme côté Next. Sans I/O réseau ni
 * lecture d'environnement.
 */
final class MailTemplates
{
    // ─────────────────────────────── Constantes SITE_CONFIG ───────────────────────────────

    private const SITE_NAME = 'Wonder Tours and Services';
    private const SITE_URL = 'https://wondertoursandservices.com';
    private const CONTACT_EMAIL = 'contact@wondertoursandservices.com';
    private const CONTACT_PHONE = '+229 97 00 00 00';
    private const CONTACT_ADDRESS = 'Ouidah, Bénin';

    public const REQUEST_TYPE_LABELS = [
        'circuit' => 'Circuit touristique',
        'stay' => 'Séjour',
        'hotel' => "Réservation d'hôtel",
        'info' => "Demande d'information",
        'other' => 'Autre demande',
    ];

    public const BOOKING_STATUS_LABELS = [
        'pending' => 'en attente de confirmation',
        'confirmed' => 'confirmée',
        'cancelled' => 'annulée',
        'completed' => 'terminée',
    ];

    private const ROLE_LABELS = [
        'admin' => 'Administrateur',
        'editor' => 'Éditeur',
        'viewer' => 'Lecteur',
    ];

    /** Mois français — Intl « fr-FR » { day: "2-digit", month: "long", year: "numeric" }. */
    private const FR_MONTHS = [
        1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril', 5 => 'mai', 6 => 'juin',
        7 => 'juillet', 8 => 'août', 9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre',
    ];

    // ─────────────────────────────── Helpers ───────────────────────────────

    /** Échappe une valeur fournie par l'utilisateur avant interpolation HTML.
     * Les entités sont construites par concaténation autour d'un « & » écrit
     * via chr(38) pour éviter tout décodage parasite du fichier
     * (même astuce que le « AMP = \u0026 » de mail-templates.ts). */
    private static function escapeHtml(string $value): string
    {
        $amp = chr(38);
        return strtr($value, [
            '&' => $amp . 'amp;',
            '<' => $amp . 'lt;',
            '>' => $amp . 'gt;',
            '"' => $amp . 'quot;',
            "'" => $amp . '#39;',
        ]);
    }

    /**
     * Formate une date PostgreSQL (colonne date) comme
     * Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).
     */
    public static function formatDate(string $pgDate): string
    {
        $date = new \DateTimeImmutable($pgDate, new \DateTimeZone('UTC'));
        return $date->format('d') . ' ' . self::FR_MONTHS[(int) $date->format('n')] . ' ' . $date->format('Y');
    }

    /**
     * Formatage prix : XOF → « 150 000 FCFA » (sans décimales), sinon
     * « 99,99 USD » (jusqu'à 2 décimales). Séparateur de milliers :
     * espace fine insécable U+202F (comme Intl fr-FR).
     *
     * @param string|float|int|null $totalPrice valeur numérique SQL (string), nombre ou null
     */
    public static function formatPrice(string|float|int|null $totalPrice, string $currency): ?string
    {
        if ($totalPrice === null) {
            return null;
        }
        $amount = (float) (string) $totalPrice;
        if (!is_finite($amount)) {
            return null;
        }
        $upper = strtoupper($currency);
        if ($upper === 'XOF') {
            return number_format($amount, 0, ',', "\u{202F}") . ' FCFA';
        }
        $formatted = number_format($amount, 2, ',', "\u{202F}");
        if (str_contains($formatted, ',')) {
            $formatted = rtrim(rtrim($formatted, '0'), ',');
        }
        return $formatted . ' ' . $upper;
    }

    private static function button(string $href, string $label): string
    {
        return '<p style="margin:24px 0 8px;"><a href="' . $href . '" style="display:inline-block;background-color:#B45309;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:14px;">' . self::escapeHtml($label) . '</a></p>';
    }

    private static function infoRow(string $label, string $value): string
    {
        return '<tr>' . "\n"
            . '  <td style="padding:6px 12px 6px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top;">' . self::escapeHtml($label) . '</td>' . "\n"
            . '  <td style="padding:6px 0;color:#17221F;font-size:13px;vertical-align:top;">' . $value . '</td>' . "\n"
            . '</tr>';
    }

    /**
     * Gabarit commun (styles inline — les clients mail ignorent les <style>).
     * Le titre est échappé ICI — les appelants y interpolent les données brutes.
     */
    private static function layout(string $title, string $bodyHtml): string
    {
        return '<!DOCTYPE html>' . "\n"
            . '<html lang="fr">' . "\n"
            . '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>' . "\n"
            . '<body style="margin:0;padding:0;background-color:#F8F6F0;font-family:Arial,Helvetica,sans-serif;color:#17221F;">' . "\n"
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F6F0;padding:24px 12px;">' . "\n"
            . '<tr><td align="center">' . "\n"
            . '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #EDE4D3;">' . "\n"
            . '<tr><td style="background-color:#17221F;padding:20px 28px;">' . "\n"
            . '<span style="color:#ffffff;font-size:18px;font-weight:bold;">Wonder Tours <span style="color:#F59E0B;">and Services</span></span>' . "\n"
            . '</td></tr>' . "\n"
            . '<tr><td style="padding:28px;">' . "\n"
            . '<h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:#17221F;">' . self::escapeHtml($title) . '</h1>' . "\n"
            . $bodyHtml . "\n"
            . '</td></tr>' . "\n"
            . '<tr><td style="padding:18px 28px;background-color:#F8F6F0;border-top:1px solid #EDE4D3;font-size:12px;line-height:1.6;color:#6B7280;">' . "\n"
            . self::escapeHtml(self::SITE_NAME) . ' — ' . self::escapeHtml(self::CONTACT_ADDRESS) . '<br>' . "\n"
            . '<a href="mailto:' . self::CONTACT_EMAIL . '" style="color:#B45309;">' . self::CONTACT_EMAIL . '</a> · ' . self::escapeHtml(self::CONTACT_PHONE) . "\n"
            . '</td></tr>' . "\n"
            . '</table>' . "\n"
            . '</td></tr>' . "\n"
            . '</table>' . "\n"
            . '</body>' . "\n"
            . '</html>';
    }

    // ─────────────────────────────── Contact ───────────────────────────────

    /**
     * Accusé de réception envoyé au visiteur après POST /api/contact.
     *
     * @param array{name: string, requestType: string} $data
     * @return array{subject: string, html: string}
     */
    public static function contactConfirmationEmail(array $data): array
    {
        $typeLabel = self::REQUEST_TYPE_LABELS[$data['requestType']] ?? $data['requestType'];
        return [
            'subject' => 'Nous avons bien reçu votre demande — Wonder Tours',
            'html' => self::layout(
                'Bonjour ' . $data['name'] . ',',
                '<p style="margin:0 0 16px;line-height:1.6;">Merci pour votre message. Votre demande <strong>« ' . self::escapeHtml($typeLabel) . ' »</strong> a bien été enregistrée.</p>' . "\n"
                . '<p style="margin:0 0 16px;line-height:1.6;">Notre équipe vous répondra dans les 24 à 48 heures. Nous vous remercions de votre patience et de votre intérêt pour nos services.</p>' . "\n"
                . self::button(self::SITE_URL, 'Découvrir nos circuits')
            ),
        ];
    }

    /**
     * Notification interne envoyée à l'équipe pour une nouvelle demande de contact.
     *
     * @param array{name: string, email: string, phone?: ?string, subject?: ?string, requestType: string, travelDate?: ?string, travelers?: ?int, message: string} $data
     * @return array{subject: string, html: string}
     */
    public static function contactNotificationEmail(array $data): array
    {
        $typeLabel = self::REQUEST_TYPE_LABELS[$data['requestType']] ?? $data['requestType'];
        $rows = [
            self::infoRow('Nom', self::escapeHtml($data['name'])),
            self::infoRow('Email', self::escapeHtml($data['email'])),
            self::infoRow('Téléphone', !empty($data['phone']) ? self::escapeHtml($data['phone']) : '—'),
            self::infoRow('Type', self::escapeHtml($typeLabel)),
        ];
        if (!empty($data['subject'])) {
            $rows[] = self::infoRow('Sujet', self::escapeHtml($data['subject']));
        }
        if (!empty($data['travelDate'])) {
            $rows[] = self::infoRow('Date de voyage', self::formatDate($data['travelDate']));
        }
        if (!empty($data['travelers'])) {
            $rows[] = self::infoRow('Voyageurs', self::escapeHtml((string) $data['travelers']));
        }
        return [
            'subject' => '[Contact] ' . $typeLabel . ' — ' . $data['name'],
            'html' => self::layout(
                'Nouvelle demande de contact',
                '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' . implode('', $rows) . "\n"
                . '<tr><td colspan="2" style="padding:12px 0 0;color:#6B7280;font-size:13px;vertical-align:top;">Message :</td></tr>' . "\n"
                . '<tr><td colspan="2" style="padding:6px 0;color:#17221F;font-size:13px;line-height:1.6;">' . self::escapeHtml($data['message']) . '</td></tr>' . "\n"
                . '</table>'
            ),
        ];
    }

    // ─────────────────────────────── Réservations ───────────────────────────────

    /**
     * Confirmation envoyée au client après POST /api/bookings.
     *
     * @param array{name: string, bookingReference: string, circuitTitle?: ?string, type: string, travelDate?: ?string, returnDate?: ?string, participants?: ?int, totalPrice?: string|float|int|null, currency: string} $data
     * @return array{subject: string, html: string}
     */
    public static function bookingConfirmationEmail(array $data): array
    {
        $price = self::formatPrice($data['totalPrice'] ?? null, $data['currency']);
        $rows = [
            self::infoRow('Référence', '<strong style="color:#B45309;">' . self::escapeHtml($data['bookingReference']) . '</strong>'),
            self::infoRow(
                'Prestation',
                self::escapeHtml($data['circuitTitle'] ?? (self::REQUEST_TYPE_LABELS[$data['type']] ?? $data['type']))
            ),
        ];
        if (!empty($data['travelDate'])) {
            $rows[] = self::infoRow('Date de départ', self::formatDate($data['travelDate']));
        }
        if (!empty($data['returnDate'])) {
            $rows[] = self::infoRow('Date de retour', self::formatDate($data['returnDate']));
        }
        if (!empty($data['participants'])) {
            $rows[] = self::infoRow('Participants', self::escapeHtml((string) $data['participants']));
        }
        if ($price !== null) {
            $rows[] = self::infoRow('Prix total', self::escapeHtml($price));
        }
        return [
            'subject' => 'Confirmation de votre réservation ' . $data['bookingReference'],
            'html' => self::layout(
                'Merci ' . $data['name'] . ', votre réservation est enregistrée !',
                '<p style="margin:0 0 16px;line-height:1.6;">Voici le récapitulatif de votre demande :</p>' . "\n"
                . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' . implode('', $rows) . '</table>' . "\n"
                . '<p style="margin:16px 0 0;line-height:1.6;">Notre équipe reviendra vers vous très vite pour confirmer les détails de votre voyage.</p>' . "\n"
                . self::button(self::SITE_URL . '/circuits', 'Voir nos circuits')
            ),
        ];
    }

    /**
     * Notification interne envoyée à l'équipe pour une nouvelle réservation.
     *
     * @param array{name: string, bookingReference: string, circuitTitle?: ?string, type: string, travelDate?: ?string, returnDate?: ?string, participants?: ?int, totalPrice?: string|float|int|null, currency: string, customerEmail: string, customerPhone?: ?string, notes?: ?string} $data
     * @return array{subject: string, html: string}
     */
    public static function bookingNotificationEmail(array $data): array
    {
        $price = self::formatPrice($data['totalPrice'] ?? null, $data['currency']);
        $rows = [
            self::infoRow('Référence', '<strong>' . self::escapeHtml($data['bookingReference']) . '</strong>'),
            self::infoRow('Client', self::escapeHtml($data['name'])),
            self::infoRow('Email', self::escapeHtml($data['customerEmail'])),
            self::infoRow('Téléphone', !empty($data['customerPhone']) ? self::escapeHtml($data['customerPhone']) : '—'),
            self::infoRow(
                'Prestation',
                self::escapeHtml($data['circuitTitle'] ?? (self::REQUEST_TYPE_LABELS[$data['type']] ?? $data['type']))
            ),
        ];
        if (!empty($data['travelDate'])) {
            $rows[] = self::infoRow('Date de départ', self::formatDate($data['travelDate']));
        }
        if (!empty($data['returnDate'])) {
            $rows[] = self::infoRow('Date de retour', self::formatDate($data['returnDate']));
        }
        if (!empty($data['participants'])) {
            $rows[] = self::infoRow('Participants', self::escapeHtml((string) $data['participants']));
        }
        if ($price !== null) {
            $rows[] = self::infoRow('Prix total', self::escapeHtml($price));
        }
        if (!empty($data['notes'])) {
            $rows[] = self::infoRow('Notes', self::escapeHtml($data['notes']));
        }
        return [
            'subject' => '[Réservation] ' . $data['bookingReference'] . ' — ' . $data['name'],
            'html' => self::layout(
                'Nouvelle réservation',
                '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' . implode('', $rows) . '</table>'
            ),
        ];
    }

    /**
     * Notification envoyée au client quand le statut de sa réservation change (dashboard).
     *
     * @param array{name: string, bookingReference: string, circuitTitle?: ?string, status: string} $data
     * @return array{subject: string, html: string}
     */
    public static function bookingStatusEmail(array $data): array
    {
        $label = self::BOOKING_STATUS_LABELS[$data['status']] ?? $data['status'];
        $detail = !empty($data['circuitTitle'])
            ? 'concernant « ' . self::escapeHtml($data['circuitTitle']) . ' »'
            : '';
        $messages = [
            'confirmed' => 'Bonne nouvelle : votre réservation a été confirmée par notre équipe. Au plaisir de vous accueillir !',
            'cancelled' => "Votre réservation a été annulée. Si vous pensez qu'il s'agit d'une erreur, contactez-nous.",
            'completed' => "Nous espérons que votre voyage a été merveilleux. Merci d'avoir voyagé avec nous !",
            'pending' => 'Votre réservation est de nouveau en attente de confirmation.',
        ];
        $message = $messages[$data['status']] ?? 'Connectez-vous à notre site pour plus de détails.';
        return [
            'subject' => 'Votre réservation ' . $data['bookingReference'] . ' est ' . $label,
            'html' => self::layout(
                'Réservation ' . $data['bookingReference'] . ' : ' . $label,
                '<p style="margin:0 0 16px;line-height:1.6;">Bonjour ' . self::escapeHtml($data['name']) . ', le statut de votre réservation ' . $detail . ' a été mis à jour.</p>' . "\n"
                . '<p style="margin:0 0 16px;line-height:1.6;">' . self::escapeHtml($message) . '</p>' . "\n"
                . self::button(self::SITE_URL . '/contact', 'Nous contacter')
            ),
        ];
    }

    // ─────────────────────────────── Authentification ───────────────────────────────

    /**
     * Email « mot de passe oublié » avec le lien de réinitialisation.
     *
     * @param array{name: string, resetUrl: string, expiresInMinutes: int} $data
     * @return array{subject: string, html: string}
     */
    public static function passwordResetEmail(array $data): array
    {
        return [
            'subject' => 'Réinitialisation de votre mot de passe — Wonder Tours',
            'html' => self::layout(
                'Bonjour ' . $data['name'] . ',',
                '<p style="margin:0 0 16px;line-height:1.6;">Vous avez demandé la réinitialisation du mot de passe de votre compte dashboard. Cliquez sur le bouton ci-dessous pour en définir un nouveau :</p>' . "\n"
                . self::button($data['resetUrl'], 'Réinitialiser mon mot de passe') . "\n"
                . '<p style="margin:8px 0 16px;line-height:1.6;font-size:12px;color:#6B7280;word-break:break-all;">Ou copiez ce lien dans votre navigateur :<br>' . self::escapeHtml($data['resetUrl']) . '</p>' . "\n"
                . '<p style="margin:0 0 8px;line-height:1.6;">Ce lien expire dans <strong>' . $data['expiresInMinutes'] . ' minutes</strong> et ne peut être utilisé qu\'une seule fois.</p>' . "\n"
                . '<p style="margin:0;line-height:1.6;">Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email : votre mot de passe restera inchangé.</p>'
            ),
        ];
    }

    /**
     * Confirmation envoyée après un changement de mot de passe réussi.
     *
     * @param array{name: string} $data
     * @return array{subject: string, html: string}
     */
    public static function passwordResetConfirmationEmail(array $data): array
    {
        return [
            'subject' => 'Votre mot de passe a été modifié — Wonder Tours',
            'html' => self::layout(
                'Bonjour ' . $data['name'] . ',',
                '<p style="margin:0 0 16px;line-height:1.6;">Le mot de passe de votre compte dashboard vient d\'être modifié.</p>' . "\n"
                . '<p style="margin:0;line-height:1.6;">Si vous n\'êtes pas à l\'origine de ce changement, contactez immédiatement l\'administrateur du site.</p>'
            ),
        ];
    }

    // ─────────────────────────────── Comptes dashboard ───────────────────────────────

    /**
     * Email de bienvenue envoyé à un utilisateur créé depuis le dashboard.
     * Le mot de passe n'est JAMAIS inclus (communiqué par l'administrateur,
     * ou réinitialisable via le lien ci-dessous).
     *
     * @param array{name: string, email: string, role: string, dashboardUrl: string, forgotPasswordUrl: string} $data
     * @return array{subject: string, html: string}
     */
    public static function userWelcomeEmail(array $data): array
    {
        $roleLabel = self::ROLE_LABELS[$data['role']] ?? $data['role'];
        $rows = [
            self::infoRow('Email de connexion', self::escapeHtml($data['email'])),
            self::infoRow('Rôle', self::escapeHtml($roleLabel)),
        ];
        return [
            'subject' => 'Votre compte Wonder Tours est prêt',
            'html' => self::layout(
                'Bienvenue ' . $data['name'] . ' !',
                '<p style="margin:0 0 16px;line-height:1.6;">Un compte <strong>' . self::escapeHtml($roleLabel) . '</strong> vient d\'être créé pour vous sur le dashboard de Wonder Tours.</p>' . "\n"
                . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' . implode('', $rows) . '</table>' . "\n"
                . self::button($data['dashboardUrl'], 'Accéder au dashboard') . "\n"
                . '<p style="margin:8px 0 16px;line-height:1.6;">Votre mot de passe vous a été communiqué par l\'administrateur. Si vous ne le connaissez pas encore, utilisez le lien « mot de passe oublié » ci-dessous pour en définir un nouveau :</p>' . "\n"
                . '<p style="margin:0;line-height:1.6;font-size:12px;color:#6B7280;"><a href="' . $data['forgotPasswordUrl'] . '" style="color:#B45309;">' . self::escapeHtml($data['forgotPasswordUrl']) . '</a></p>'
            ),
        ];
    }
}
