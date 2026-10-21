import { describe, expect, test } from "bun:test";
import { prisma } from "@/lib/db";
import {
  listCircuits,
  getCircuitBySlug,
  getCircuitById,
  createCircuit,
  updateCircuit,
  deleteCircuit,
} from "@/lib/services/circuits";
import {
  createCategory,
  deleteCategory,
} from "@/lib/services/categories";
import { slugify } from "@/lib/slug";
import { uniquePrefix } from "./helpers";

describe("circuits", () => {
  // Timeout étendu : la base Aiven est distante (~300-500 ms par requête).
  test("CRUD complet + filtres", async () => {
    const title = uniquePrefix("Circuit");
    const price = 25000;

    // CREATE (via service direct, slug calculé par l'appelant comme la route)
    let circuit = await createCircuit({
      title,
      slug: uniquePrefix("circuit"),
      price,
      durationDays: 3,
      currency: "XOF",
      isActive: false,
      highlights: ["Journée 1", "Journée 2"],
      itinerary: [{ day: 1, title: "Arrivée" }],
    });
    expect(circuit.id).toBeDefined();
    expect(circuit.isActive).toBe(false);

    try {
      // GET par slug : inactif exclu par défaut, inclus avec includeInactive
      expect(await getCircuitBySlug(circuit.slug)).toBeNull();
      expect(await getCircuitBySlug(circuit.slug, true)).not.toBeNull();

      // LIST : total inclut les inactifs (dashboard), filtre active=true les exclut
      const all = await listCircuits({ q: title });
      expect(all.total).toBe(1);
      const activeOnly = await listCircuits({ q: title, active: true });
      expect(activeOnly.total).toBe(0);

      // UPDATE : prix + activation
      circuit = await updateCircuit(circuit.id, {
        price: 30000,
        isActive: true,
      });
      expect(Number(circuit.price)).toBe(30000);
      expect(await getCircuitBySlug(circuit.slug)).not.toBeNull();

      // Filtres prix/durée
      const byPrice = await listCircuits({ q: title, maxPrice: 29999 });
      expect(byPrice.total).toBe(0);
      const byDuration = await listCircuits({ q: title, maxDuration: 3 });
      expect(byDuration.total).toBe(1);
    } finally {
      await deleteCircuit(circuit.id);
    }

    expect(await prisma.circuit.findUnique({ where: { id: circuit.id } })).toBeNull();
  }, 20000);

  // Timeout étendu : ~14 allers-retours vers la base Aiven distante.
  test(
    "multi-catégories : connect, filtre categorySlug, set",
    async () => {
      const nameA = uniquePrefix("CatA");
      const nameB = uniquePrefix("CatB");
      const [categoryA, categoryB] = await Promise.all([
        createCategory({ name: nameA, slug: slugify(nameA) }),
        createCategory({ name: nameB, slug: slugify(nameB) }),
      ]);
      const title = uniquePrefix("Circuit");

      // CREATE : relation m-n implicite (plusieurs catégories d'un coup)
      const circuit = await createCircuit({
        title,
        slug: uniquePrefix("circuit"),
        price: 15000,
        currency: "XOF",
        categories: { connect: [{ id: categoryA.id }, { id: categoryB.id }] },
      });

      try {
        const created = await getCircuitById(circuit.id);
        expect(created?.categories.map((c) => c.id).sort()).toEqual(
          [categoryA.id, categoryB.id].sort()
        );

        // Filtre categorySlug (some) : le circuit matche chaque catégorie
        expect(
          (await listCircuits({ q: title, categorySlug: slugify(nameA) })).total
        ).toBe(1);
        expect(
          (await listCircuits({ q: title, categorySlug: slugify(nameB) })).total
        ).toBe(1);

        // UPDATE set : remplace toutes les catégories
        await updateCircuit(circuit.id, {
          categories: { set: [{ id: categoryA.id }] },
        });
        const afterSet = await getCircuitById(circuit.id);
        expect(afterSet?.categories.map((c) => c.id)).toEqual([categoryA.id]);

        // set avec tableau vide : purge totale de la relation
        await updateCircuit(circuit.id, { categories: { set: [] } });
        const emptied = await getCircuitById(circuit.id);
        expect(emptied?.categories).toHaveLength(0);
        expect(
          (await listCircuits({ q: title, categorySlug: slugify(nameA) })).total
        ).toBe(0);
      } finally {
        await deleteCircuit(circuit.id);
        await deleteCategory(categoryA.id);
        await deleteCategory(categoryB.id);
      }
    },
    20000
  );
});
