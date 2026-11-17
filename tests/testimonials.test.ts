import { describe, expect, test } from "bun:test";
import {
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/lib/services/testimonials";
import { uniquePrefix } from "./helpers";

describe("témoignages", () => {
  test("CRUD + filtres featured/active", async () => {
    const name = uniquePrefix("Témoin");

    const testimonial = await createTestimonial({
      name,
      country: "France",
      rating: 5,
      text: "Un voyage inoubliable au Bénin, je recommande vivement.",
      isFeatured: false,
      isActive: true,
    });

    try {
      expect((await listTestimonials({ q: name })).total).toBe(1);
      expect((await listTestimonials({ q: name, featured: true })).total).toBe(0);

      const updated = await updateTestimonial(testimonial.id, {
        isFeatured: true,
        rating: 4,
      });
      expect(updated.isFeatured).toBe(true);
      expect(updated.rating).toBe(4);

      // Featured en priorité : le témoin modifié apparaît en tête des résultats
      const list = await listTestimonials({ q: name, featured: true });
      expect(list.total).toBe(1);
      expect(list.items[0].isFeatured).toBe(true);
    } finally {
      await deleteTestimonial(testimonial.id);
    }
  });

  test("création publique : défauts de modération (non vérifié, actif)", async () => {
    // Un témoignage laissé par un visiteur (POST /api/testimonials côté
    // PHP) est inséré sans champs de modération : les defaults de la base
    // s'appliquent — publication immédiate, non vérifié, non à la une.
    const name = uniquePrefix("Visiteur");
    const testimonial = await createTestimonial({
      name,
      rating: 4,
      text: "Super séjour, l'équipe nous a très bien accueillis à Ouidah.",
    });

    try {
      expect(testimonial.isActive).toBe(true);
      expect(testimonial.isVerified).toBe(false);
      expect(testimonial.isFeatured).toBe(false);
    } finally {
      await deleteTestimonial(testimonial.id);
    }
  });
});
