import { describe, expect, test } from "bun:test";
import {
  createContactRequest,
  getContactRequestById,
  listContactRequests,
  updateContactRequestStatus,
  deleteContactRequest,
} from "@/lib/services/contact-requests";
import {
  getSetting,
  listSettings,
  upsertSettings,
} from "@/lib/services/settings";
import { getDashboardStats } from "@/lib/services/stats";
import { createCircuit, deleteCircuit } from "@/lib/services/circuits";
import { prisma } from "@/lib/db";
import { uniquePrefix } from "./helpers";

describe("demandes de contact", () => {
  test("création (statut new) + changement de statut", async () => {
    const req = await createContactRequest({
      name: "Visiteur Test",
      email: `contact-${uniquePrefix("mail")}@example.com`,
      message: "Bonjour, je souhaite des informations sur vos circuits.",
      requestType: "stay",
    });

    try {
      expect((await getContactRequestById(req.id))?.status).toBe("new");
      expect((await listContactRequests({ status: "new", q: req.email })).total).toBe(1);

      const answered = await updateContactRequestStatus(req.id, "answered");
      expect(answered.status).toBe("answered");
      expect((await listContactRequests({ status: "new", q: req.email })).total).toBe(0);
    } finally {
      await deleteContactRequest(req.id);
    }
  });
});

describe("settings", () => {
  test("upsert groupe : création puis mise à jour, restauration", async () => {
    const key = uniquePrefix("test_setting");
    try {
      // Création
      await upsertSettings([{ key, value: "première valeur" }]);
      expect(await getSetting(key)).toBe("première valeur");

      // Mise à jour
      await upsertSettings([{ key, value: "seconde valeur" }]);
      expect(await getSetting(key)).toBe("seconde valeur");

      // listSettings contient la clé
      const all = await listSettings();
      expect(all.some((s) => s.key === key && s.value === "seconde valeur")).toBe(true);
    } finally {
      const { prisma } = await import("@/lib/db");
      await prisma.setting.delete({ where: { key } });
    }
  });
});

describe("stats", () => {
  test("agrégats dashboard cohérents", async () => {
    // Fixtures propres au test : le seed statique ayant été vidé (le contenu
    // vit dans la base de production), le test ne doit pas dépendre du
    // contenu préexistant de la base — il doit passer sur une base fraîche
    // (CI) comme sur la base de production.
    const prefix = uniquePrefix("stat");
    const destination = await prisma.destination.create({
      data: { name: prefix, slug: uniquePrefix("stat-dest"), country: "Bénin" },
    });
    const circuitVedette = await createCircuit({
      title: `${prefix} vedette`,
      slug: uniquePrefix("stat-circuit-vedette"),
      price: 25000,
      durationDays: 2,
      currency: "XOF",
      isActive: true,
      isFeatured: true,
      highlights: ["Étape 1"],
      itinerary: [{ day: 1, title: "Arrivée" }],
    });
    const circuitInactif = await createCircuit({
      title: `${prefix} inactif`,
      slug: uniquePrefix("stat-circuit-inactif"),
      price: 15000,
      durationDays: 1,
      currency: "XOF",
      isActive: false,
      highlights: ["Étape 1"],
      itinerary: [{ day: 1, title: "Arrivée" }],
    });

    try {
      const stats = await getDashboardStats();
      // Bornes minimales garanties par les fixtures ci-dessus.
      expect(stats.circuits.total).toBeGreaterThanOrEqual(2);
      expect(stats.circuits.active).toBeGreaterThanOrEqual(1);
      expect(stats.circuits.featured).toBeLessThanOrEqual(stats.circuits.active);
      expect(stats.destinations.total).toBeGreaterThanOrEqual(1);
      expect(stats.bookings.revenueThisMonth).toBeGreaterThanOrEqual(0);
      expect(typeof stats.testimonials.averageRating).not.toBe("undefined");
      expect(Array.isArray(stats)).toBe(false);
    } finally {
      await deleteCircuit(circuitVedette.id);
      await deleteCircuit(circuitInactif.id);
      await prisma.destination.delete({ where: { id: destination.id } });
    }
  });
});
