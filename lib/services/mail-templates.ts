import { SITE_CONFIG } from "@/lib/constants";

/**
 * Templates des emails du projet — fonctions pures `{ subject, html }`,
 * sans I/O réseau ni lecture d'environnement : testables unitairement.
 * Le texte fourni par l'utilisateur est échappé via `escapeHtml`.
 */

export interface EmailContent {
  subject: string;
  html: string;
}

// ─────────────────────────────── Helpers ───────────────────────────────

/** Échappe une valeur fournie par l'utilisateur avant interpolation HTML.
 * Les entités sont construites par concaténation autour d'un « & » écrit
 * en unicode échappé pour éviter tout décodage parasite du fichier. */
function escapeHtml(value: string): string {
  const AMP = "\u0026";
  const entities: Record<string, string> = {
    [AMP]: AMP + "amp;",
    "<": AMP + "lt;",
    ">": AMP + "gt;",
    '"': AMP + "quot;",
    "'": AMP + "#39;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Prix accepté en entrée : nombre, chaîne ou Decimal Prisma ({ toString() }). */
export type PriceLike = number | string | { toString(): string };

/** Formatage prix : XOF → « 150 000 FCFA » (sans décimales), sinon « 99.99 USD ». */
export function formatPrice(
  totalPrice: PriceLike | null | undefined,
  currency: string
): string | null {
  if (totalPrice === null || totalPrice === undefined) return null;
  const amount = Number(totalPrice.toString());
  if (!Number.isFinite(amount)) return null;
  const upper = currency.toUpperCase();
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: upper === "XOF" ? 0 : 2,
  }).format(amount);
  return upper === "XOF" ? `${formatted} FCFA` : `${formatted} ${upper}`;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  circuit: "Circuit touristique",
  stay: "Séjour",
  hotel: "Réservation d'hôtel",
  info: "Demande d'information",
  other: "Autre demande",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "en attente de confirmation",
  confirmed: "confirmée",
  cancelled: "annulée",
  completed: "terminée",
};

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;"><a href="${href}" style="display:inline-block;background-color:#B45309;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:14px;">${escapeHtml(label)}</a></p>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:6px 12px 6px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
  <td style="padding:6px 0;color:#17221F;font-size:13px;vertical-align:top;">${value}</td>
</tr>`;
}

/** Gabarit commun (styles inline — les clients mail ignorent les <style>).
 * Le titre est échappé ICI — les appelants y interpolent les données brutes. */
function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F8F6F0;font-family:Arial,Helvetica,sans-serif;color:#17221F;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F6F0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #EDE4D3;">
<tr><td style="background-color:#17221F;padding:20px 28px;">
<span style="color:#ffffff;font-size:18px;font-weight:bold;">Wonder Tours <span style="color:#F59E0B;">and Services</span></span>
</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:#17221F;">${escapeHtml(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:18px 28px;background-color:#F8F6F0;border-top:1px solid #EDE4D3;font-size:12px;line-height:1.6;color:#6B7280;">
${escapeHtml(SITE_CONFIG.name)} — ${escapeHtml(SITE_CONFIG.contact.address)}<br>
<a href="mailto:${SITE_CONFIG.contact.email}" style="color:#B45309;">${SITE_CONFIG.contact.email}</a> · ${escapeHtml(SITE_CONFIG.contact.phone)}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────── Contact ───────────────────────────────

export interface ContactConfirmationData {
  name: string;
  requestType: string;
}

/** Accusé de réception envoyé au visiteur après POST /api/contact. */
export function contactConfirmationEmail(data: ContactConfirmationData): EmailContent {
  const typeLabel = REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType;
  return {
    subject: "Nous avons bien reçu votre demande — Wonder Tours",
    html: layout(
      `Bonjour ${data.name},`,
      `<p style="margin:0 0 16px;line-height:1.6;">Merci pour votre message. Votre demande <strong>« ${escapeHtml(typeLabel)} »</strong> a bien été enregistrée.</p>
<p style="margin:0 0 16px;line-height:1.6;">Notre équipe vous répondra dans les 24 à 48 heures. Nous vous remercions de votre patience et de votre intérêt pour nos services.</p>
${button(SITE_CONFIG.url, "Découvrir nos circuits")}`
    ),
  };
}

export interface ContactNotificationData {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  requestType: string;
  travelDate?: Date | null;
  travelers?: number | null;
  message: string;
}

/** Notification interne envoyée à l'équipe pour une nouvelle demande de contact. */
export function contactNotificationEmail(data: ContactNotificationData): EmailContent {
  const typeLabel = REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType;
  return {
    subject: `[Contact] ${typeLabel} — ${data.name}`,
    html: layout(
      "Nouvelle demande de contact",
      `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${[
        infoRow("Nom", escapeHtml(data.name)),
        infoRow("Email", escapeHtml(data.email)),
        infoRow("Téléphone", data.phone ? escapeHtml(data.phone) : "—"),
        infoRow("Type", escapeHtml(typeLabel)),
        data.subject ? infoRow("Sujet", escapeHtml(data.subject)) : "",
        data.travelDate ? infoRow("Date de voyage", formatDate(data.travelDate)) : "",
        data.travelers ? infoRow("Voyageurs", escapeHtml(String(data.travelers))) : "",
      ]
        .filter(Boolean)
        .join("")}
<tr><td colspan="2" style="padding:12px 0 0;color:#6B7280;font-size:13px;vertical-align:top;">Message :</td></tr>
<tr><td colspan="2" style="padding:6px 0;color:#17221F;font-size:13px;line-height:1.6;">${escapeHtml(data.message)}</td></tr>
</table>`
    ),
  };
}

// ─────────────────────────────── Réservations ───────────────────────────────

export interface BookingConfirmationData {
  name: string;
  bookingReference: string;
  circuitTitle?: string | null;
  type: string;
  travelDate?: Date | null;
  returnDate?: Date | null;
  participants?: number | null;
  totalPrice?: PriceLike | null;
  currency: string;
}

/** Confirmation envoyée au client après POST /api/bookings. */
export function bookingConfirmationEmail(data: BookingConfirmationData): EmailContent {
  const price = formatPrice(data.totalPrice, data.currency);
  return {
    subject: `Confirmation de votre réservation ${data.bookingReference}`,
    html: layout(
      `Merci ${data.name}, votre réservation est enregistrée !`,
      `<p style="margin:0 0 16px;line-height:1.6;">Voici le récapitulatif de votre demande :</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${[
        infoRow("Référence", `<strong style="color:#B45309;">${escapeHtml(data.bookingReference)}</strong>`),
        infoRow(
          "Prestation",
          escapeHtml(data.circuitTitle ?? REQUEST_TYPE_LABELS[data.type] ?? data.type)
        ),
        data.travelDate ? infoRow("Date de départ", formatDate(data.travelDate)) : "",
        data.returnDate ? infoRow("Date de retour", formatDate(data.returnDate)) : "",
        data.participants ? infoRow("Participants", escapeHtml(String(data.participants))) : "",
        price ? infoRow("Prix total", escapeHtml(price)) : "",
      ]
        .filter(Boolean)
        .join("")}</table>
<p style="margin:16px 0 0;line-height:1.6;">Notre équipe reviendra vers vous très vite pour confirmer les détails de votre voyage.</p>
${button(`${SITE_CONFIG.url}/circuits`, "Voir nos circuits")}`
    ),
  };
}

export interface BookingNotificationData extends BookingConfirmationData {
  customerEmail: string;
  customerPhone?: string | null;
  notes?: string | null;
}

/** Notification interne envoyée à l'équipe pour une nouvelle réservation. */
export function bookingNotificationEmail(data: BookingNotificationData): EmailContent {
  const price = formatPrice(data.totalPrice, data.currency);
  return {
    subject: `[Réservation] ${data.bookingReference} — ${data.name}`,
    html: layout(
      "Nouvelle réservation",
      `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${[
        infoRow("Référence", `<strong>${escapeHtml(data.bookingReference)}</strong>`),
        infoRow("Client", escapeHtml(data.name)),
        infoRow("Email", escapeHtml(data.customerEmail)),
        infoRow("Téléphone", data.customerPhone ? escapeHtml(data.customerPhone) : "—"),
        infoRow(
          "Prestation",
          escapeHtml(data.circuitTitle ?? REQUEST_TYPE_LABELS[data.type] ?? data.type)
        ),
        data.travelDate ? infoRow("Date de départ", formatDate(data.travelDate)) : "",
        data.returnDate ? infoRow("Date de retour", formatDate(data.returnDate)) : "",
        data.participants ? infoRow("Participants", escapeHtml(String(data.participants))) : "",
        price ? infoRow("Prix total", escapeHtml(price)) : "",
        data.notes ? infoRow("Notes", escapeHtml(data.notes)) : "",
      ]
        .filter(Boolean)
        .join("")}</table>`
    ),
  };
}

export interface BookingStatusData {
  name: string;
  bookingReference: string;
  circuitTitle?: string | null;
  status: string;
}

/** Notification envoyée au client quand le statut de sa réservation change (dashboard). */
export function bookingStatusEmail(data: BookingStatusData): EmailContent {
  const label = BOOKING_STATUS_LABELS[data.status] ?? data.status;
  const detail =
    data.circuitTitle
      ? `concernant « ${escapeHtml(data.circuitTitle)} »`
      : "";
  const message: Record<string, string> = {
    confirmed: "Bonne nouvelle : votre réservation a été confirmée par notre équipe. Au plaisir de vous accueillir !",
    cancelled: "Votre réservation a été annulée. Si vous pensez qu'il s'agit d'une erreur, contactez-nous.",
    completed: "Nous espérons que votre voyage a été merveilleux. Merci d'avoir voyagé avec nous !",
    pending: "Votre réservation est de nouveau en attente de confirmation.",
  };
  return {
    subject: `Votre réservation ${data.bookingReference} est ${label}`,
    html: layout(
      `Réservation ${data.bookingReference} : ${label}`,
      `<p style="margin:0 0 16px;line-height:1.6;">Bonjour ${escapeHtml(data.name)}, le statut de votre réservation ${detail} a été mis à jour.</p>
<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(message[data.status] ?? "Connectez-vous à notre site pour plus de détails.")}</p>
${button(`${SITE_CONFIG.url}/contact`, "Nous contacter")}`
    ),
  };
}

// ─────────────────────────────── Authentification ───────────────────────────────

export interface PasswordResetData {
  name: string;
  resetUrl: string;
  /** Durée de validité du lien, en minutes. */
  expiresInMinutes: number;
}

/** Email « mot de passe oublié » avec le lien de réinitialisation. */
export function passwordResetEmail(data: PasswordResetData): EmailContent {
  return {
    subject: "Réinitialisation de votre mot de passe — Wonder Tours",
    html: layout(
      `Bonjour ${data.name},`,
      `<p style="margin:0 0 16px;line-height:1.6;">Vous avez demandé la réinitialisation du mot de passe de votre compte dashboard. Cliquez sur le bouton ci-dessous pour en définir un nouveau :</p>
${button(data.resetUrl, "Réinitialiser mon mot de passe")}
<p style="margin:8px 0 16px;line-height:1.6;font-size:12px;color:#6B7280;word-break:break-all;">Ou copiez ce lien dans votre navigateur :<br>${escapeHtml(data.resetUrl)}</p>
<p style="margin:0 0 8px;line-height:1.6;">Ce lien expire dans <strong>${data.expiresInMinutes} minutes</strong> et ne peut être utilisé qu'une seule fois.</p>
<p style="margin:0;line-height:1.6;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe restera inchangé.</p>`
    ),
  };
}

export interface PasswordResetConfirmationData {
  name: string;
}

/** Confirmation envoyée après un changement de mot de passe réussi. */
export function passwordResetConfirmationEmail(
  data: PasswordResetConfirmationData
): EmailContent {
  return {
    subject: "Votre mot de passe a été modifié — Wonder Tours",
    html: layout(
      `Bonjour ${data.name},`,
      `<p style="margin:0 0 16px;line-height:1.6;">Le mot de passe de votre compte dashboard vient d'être modifié.</p>
<p style="margin:0;line-height:1.6;">Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement l'administrateur du site.</p>`
    ),
  };
}

// ─────────────────────────────── Comptes dashboard ───────────────────────────────

export interface UserWelcomeData {
  name: string;
  email: string;
  role: string;
  dashboardUrl: string;
  /** Lien « mot de passe oublié » pour définir un premier mot de passe. */
  forgotPasswordUrl: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  editor: "Éditeur",
  viewer: "Lecteur",
};

/** Email de bienvenue envoyé à un utilisateur créé depuis le dashboard.
 * Le mot de passe n'est JAMAIS inclus (communiqué par l'administrateur,
 * ou réinitialisable via le lien ci-dessous). */
export function userWelcomeEmail(data: UserWelcomeData): EmailContent {
  return {
    subject: "Votre compte Wonder Tours est prêt",
    html: layout(
      `Bienvenue ${data.name} !`,
      `<p style="margin:0 0 16px;line-height:1.6;">Un compte <strong>${escapeHtml(ROLE_LABELS[data.role] ?? data.role)}</strong> vient d'être créé pour vous sur le dashboard de Wonder Tours.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${[
        infoRow("Email de connexion", escapeHtml(data.email)),
        infoRow("Rôle", escapeHtml(ROLE_LABELS[data.role] ?? data.role)),
      ].join("")}</table>
${button(data.dashboardUrl, "Accéder au dashboard")}
<p style="margin:8px 0 16px;line-height:1.6;">Votre mot de passe vous a été communiqué par l'administrateur. Si vous ne le connaissez pas encore, utilisez le lien « mot de passe oublié » ci-dessous pour en définir un nouveau :</p>
<p style="margin:0;line-height:1.6;font-size:12px;color:#6B7280;"><a href="${data.forgotPasswordUrl}" style="color:#B45309;">${escapeHtml(data.forgotPasswordUrl)}</a></p>`
    ),
  };
}
