import { Resend } from "resend";
import { SITE_CONFIG } from "@/lib/constants";
import type { EmailContent } from "@/lib/services/mail-templates";

/**
 * Envoi d'emails via Resend (https://resend.com).
 *
 * Suivant le pattern des autres dépendances externes du projet (DeepL, imgBB),
 * la dégradation est gracieuse : sans `RESEND_API_KEY`, l'envoi est ignoré
 * (log console) et ne fait jamais échouer la requête HTTP appelante.
 *
 * Variables d'environnement :
 * - `RESEND_API_KEY`  — requise pour tout envoi réel ;
 * - `MAIL_FROM`       — expéditeur, défaut « Wonder Tours <onboarding@resend.dev> »
 *                       (domaine Resend de test : ne délivre que vers l'email du compte) ;
 * - `MAIL_TEAM_EMAIL` — destinataire des notifications internes,
 *                       défaut SITE_CONFIG.contact.email ;
 * - `APP_URL`         — base des liens (reset, dashboard), défaut
 *                       `NEXT_PUBLIC_SITE_URL` puis SITE_CONFIG.url.
 */

// ─────────────────────────────── Configuration ───────────────────────────────

export function getMailFrom(): string {
  return process.env.MAIL_FROM ?? `Wonder Tours <onboarding@resend.dev>`;
}

/** Destinataires des notifications internes (nouveau contact, réservation…). */
export function getTeamEmails(): string[] {
  const raw = process.env.MAIL_TEAM_EMAIL ?? SITE_CONFIG.contact.email;
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

/** URL publique du site, base des liens insérés dans les emails. */
export function getAppUrl(): string {
  const url =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? SITE_CONFIG.url;
  return url.replace(/\/+$/, "");
}

// ─────────────────────────────── Envoi ───────────────────────────────

export interface SendEmailInput extends EmailContent {
  to: string | string[];
  /** Adresse « Répondre à » (ex. email du visiteur pour une demande de contact). */
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  /** true quand l'envoi a été ignoré faute de configuration (RESEND_API_KEY). */
  skipped: boolean;
  error?: string;
}

let client: Resend | null = null;

/** Client Resend à initialisation paresseuse — null si non configuré. */
function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client ??= new Resend(apiKey);
  return client;
}

/**
 * Envoie un email via Resend. Sans `RESEND_API_KEY` : skip (aucune erreur).
 * Retourne le résultat — les erreurs Resend ne lèvent pas d'exception.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getClient();
  if (!resend) {
    console.warn(`[mail] RESEND_API_KEY absente — email non envoyé : ${input.subject}`);
    return { sent: false, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getMailFrom(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (error) {
      console.error("[mail] Échec de l'envoi Resend :", error);
      return { sent: false, skipped: false, error: error.message };
    }
    if (data?.id) {
      console.info(`[mail] Email envoyé (id ${data.id}) : ${input.subject}`);
    }
    return { sent: true, skipped: false };
  } catch (error) {
    console.error("[mail] Exception pendant l'envoi :", error);
    return {
      sent: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Variante « best effort » pour les envois annexes (confirmations,
 * notifications) : n'échoue JAMAIS — les erreurs sont loggées uniquement,
 * pour ne pas casser le flux HTTP appelant (contact, réservation…).
 */
export async function sendEmailSafe(input: SendEmailInput): Promise<void> {
  await sendEmail(input);
}
