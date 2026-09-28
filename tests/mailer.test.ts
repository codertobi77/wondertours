import { beforeEach, describe, expect, test } from "bun:test";
import {
  bookingConfirmationEmail,
  bookingNotificationEmail,
  bookingStatusEmail,
  contactConfirmationEmail,
  contactNotificationEmail,
  formatPrice,
  passwordResetConfirmationEmail,
  passwordResetEmail,
  userWelcomeEmail,
} from "@/lib/services/mail-templates";
import {
  getAppUrl,
  getMailFrom,
  getTeamEmails,
  sendEmail,
  sendEmailSafe,
} from "@/lib/services/mailer";

// Les entités HTML sont construites par concaténation (cf. mail-templates)
// pour rester lisibles ici quel que soit l'encodage du fichier.
const AMP = "\u0026";

describe("mail-templates", () => {
  test("formatPrice : XOF sans décimales, autres devises avec", () => {
    const xof = new Intl.NumberFormat("fr-FR").format(150000);
    expect(formatPrice(150000, "XOF")).toBe(`${xof} FCFA`);
    const usd = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(99.99);
    expect(formatPrice("99.99", "USD")).toBe(`${usd} USD`);
    expect(formatPrice(null, "XOF")).toBeNull();
    expect(formatPrice(undefined, "XOF")).toBeNull();
    // Decimal Prisma ({ toString() })
    expect(formatPrice({ toString: () => "90000" }, "XOF")).toContain("FCFA");
  });

  test("contactConfirmationEmail : accusé de réception, nom échappé", () => {
    const email = contactConfirmationEmail({
      name: "Léa <script>alert(1)</script>",
      requestType: "circuit",
    });
    expect(email.subject).toContain("Wonder Tours");
    expect(email.html).toContain("Léa");
    expect(email.html).toContain("Circuit touristique");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain(AMP + "lt;script" + AMP + "gt;");
  });

  test("contactNotificationEmail : détails + message échappé", () => {
    const email = contactNotificationEmail({
      name: "Awa",
      email: "awa@example.com",
      phone: "+229 97 00 00 00",
      requestType: "stay",
      travelDate: new Date("2026-12-15T00:00:00Z"),
      travelers: 2,
      message: 'Bonjour "quote" <b>gras</b> & co',
    });
    expect(email.subject).toContain("Awa");
    expect(email.html).toContain("awa@example.com");
    expect(email.html).toContain("Séjour");
    expect(email.html).toContain("15 décembre 2026");
    expect(email.html).not.toContain('<b>gras</b>');
    expect(email.html).not.toContain('"quote"');
    expect(email.html).toContain(AMP + "quot;quote" + AMP + "quot;");
  });

  test("bookingConfirmationEmail : référence, circuit, dates, prix FCFA", () => {
    const email = bookingConfirmationEmail({
      name: "John",
      bookingReference: "WT-AB12CD",
      circuitTitle: "Ganvié, la cité lacustre",
      type: "circuit",
      travelDate: new Date("2026-12-15T00:00:00Z"),
      returnDate: new Date("2026-12-20T00:00:00Z"),
      participants: 2,
      totalPrice: 90000,
      currency: "XOF",
    });
    expect(email.subject).toContain("WT-AB12CD");
    expect(email.html).toContain("WT-AB12CD");
    expect(email.html).toContain("Ganvié, la cité lacustre");
    expect(email.html).toContain("15 décembre 2026");
    expect(email.html).toContain("20 décembre 2026");
    const price = new Intl.NumberFormat("fr-FR").format(90000);
    expect(email.html).toContain(`${price} FCFA`);
  });

  test("bookingNotificationEmail : coordonnées client + notes", () => {
    const email = bookingNotificationEmail({
      name: "John",
      bookingReference: "WT-AB12CD",
      circuitTitle: "Ganvié",
      type: "circuit",
      totalPrice: 90000,
      currency: "XOF",
      customerEmail: "john@example.com",
      customerPhone: "+229 97 00 00 00",
      notes: "Arrivée tardive",
    });
    expect(email.subject).toContain("WT-AB12CD");
    expect(email.html).toContain("john@example.com");
    expect(email.html).toContain("Arrivée tardive");
  });

  test("bookingStatusEmail : statuts FR par état", () => {
    for (const [status, label] of [
      ["confirmed", "confirmée"],
      ["cancelled", "annulée"],
      ["completed", "terminée"],
      ["pending", "en attente de confirmation"],
    ] as const) {
      const email = bookingStatusEmail({
        name: "John",
        bookingReference: "WT-AB12CD",
        circuitTitle: "Ganvié",
        status,
      });
      expect(email.subject).toContain(label);
      expect(email.html).toContain(label);
    }
  });

  test("passwordResetEmail : lien, durée, usage unique", () => {
    const resetUrl = "http://localhost:3000/dashboard/reset-password?token=abc123";
    const email = passwordResetEmail({
      name: "Awa",
      resetUrl,
      expiresInMinutes: 60,
    });
    expect(email.subject).toContain("Réinitialisation");
    expect(email.html).toContain(resetUrl);
    expect(email.html).toContain("60 minutes");
  });

  test("passwordResetConfirmationEmail", () => {
    const email = passwordResetConfirmationEmail({ name: "Awa" });
    expect(email.subject).toContain("modifié");
    expect(email.html).toContain("Awa");
  });

  test("userWelcomeEmail : email, rôle, sans mot de passe en clair", () => {
    const email = userWelcomeEmail({
      name: "Awa",
      email: "awa@wondertours.bj",
      role: "editor",
      dashboardUrl: "http://localhost:3000/dashboard",
      forgotPasswordUrl: "http://localhost:3000/dashboard/forgot-password",
    });
    expect(email.html).toContain("awa@wondertours.bj");
    expect(email.html).toContain("Éditeur");
    expect(email.html).toContain("/dashboard/forgot-password");
    // Le template ne prend jamais de mot de passe en entrée (typage TS) —
    // on vérifie juste qu'aucune valeur de mot de passe ne s'y glisse.
    expect(email.html).not.toContain("motdepasse123");
  });
});

describe("mailer (Resend)", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.MAIL_FROM;
    delete process.env.MAIL_TEAM_EMAIL;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  test("sans RESEND_API_KEY : envoi ignoré (skipped), jamais d'exception", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>x</p>",
    });
    expect(result.sent).toBe(false);
    expect(result.skipped).toBe(true);

    // sendEmailSafe ne lève jamais — même signature.
    await sendEmailSafe({ to: "test@example.com", subject: "T", html: "<p></p>" });
  });

  test("valeurs par défaut : expéditeur, équipe, URL du site", () => {
    expect(getMailFrom()).toBe("Wonder Tours <onboarding@resend.dev>");
    expect(getTeamEmails()).toEqual(["contact@wondertours.bj"]);
    expect(getAppUrl()).toBe("https://wondertours.bj");
  });

  test("getTeamEmails : liste séparée par des virgules", () => {
    process.env.MAIL_TEAM_EMAIL = "a@wondertours.bj, b@wondertours.bj , ,";
    expect(getTeamEmails()).toEqual(["a@wondertours.bj", "b@wondertours.bj"]);
  });

  test("getAppUrl : APP_URL prioritaire, slashs finaux retirés", () => {
    process.env.APP_URL = "http://localhost:3000///";
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
