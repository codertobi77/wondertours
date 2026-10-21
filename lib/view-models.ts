/**
 * Adaptateurs Prisma → view-models attendus par les composants front.
 *
 * Les cards et pages publiques ont été conçues autour des formes statiques de
 * `lib/data/*` (relations en strings, prix number, durées "2 jours"...).
 * Plutôt que modifier tous les composants, on convertit ici les enregistrements
 * de la base (relations objets, Decimal, Int, DateTime, Json) vers ces formes.
 */
import type { Circuit as StaticCircuit } from "@/lib/data/circuits";
import type { BlogPost as StaticBlogPost } from "@/lib/data/blog";
import type { Testimonial as StaticTestimonial } from "@/lib/data/testimonials";
import type { CircuitWithRelations } from "@/lib/services/circuits";
import type { BlogPostWithRelations } from "@/lib/services/blog";
import type { Testimonial } from "@/lib/db";

// ─────────────────────────────── Helpers ───────────────────────────────

/**
 * Image affichée quand un enregistrement n'a pas d'imageUrl en base
 * (ex. article créé depuis le dashboard sans photo). Un "" ici se
 * propagerait jusqu'à <img src=""> → rechargement de la page entière.
 */
export const FALLBACK_IMAGE = "/images/placeholder.svg";

/** Json → tableau de chaînes (highlights, included, excluded...). */
export function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Json → itinéraire typé (programme jour par jour). */
export function toItinerary(
  value: unknown
): { day: number; title: string; description: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      if (typeof e.day !== "number" || typeof e.title !== "string") return null;
      return {
        day: e.day,
        title: e.title,
        description: typeof e.description === "string" ? e.description : "",
      };
    })
    .filter((v): v is { day: number; title: string; description: string } => v !== null);
}

/** durationDays → "1 jour" / "2 jours" ; null → "Durée sur mesure". */
function formatDuration(days: number | null | undefined): string {
  if (!days || days < 1) return "Sur mesure";
  return `${days} jour${days > 1 ? "s" : ""}`;
}

/** Variante EN : "1 day" / "2 days" ; null → "Custom". */
function formatDurationEn(days: number | null | undefined): string {
  if (!days || days < 1) return "Custom";
  return `${days} day${days > 1 ? "s" : ""}`;
}

/** Date ISO → "2024-01-15" (format des view-models statiques). */
function toDateString(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

// ─────────────────────────────── Circuits ───────────────────────────────

export function toCircuitVM(circuit: CircuitWithRelations): StaticCircuit {
  return {
    id: circuit.id,
    slug: circuit.slug,
    title: circuit.title,
    titleEn: circuit.titleEn ?? undefined,
    destination: circuit.destination?.name ?? "Bénin",
    destinationEn: circuit.destination?.nameEn ?? undefined,
    categories: circuit.categories.map((category) => category.name),
    categoriesEn: circuit.categories.map(
      (category) => category.nameEn ?? category.name
    ),
    duration: formatDuration(circuit.durationDays),
    durationEn: formatDurationEn(circuit.durationDays),
    price: Number(circuit.price),
    image: circuit.imageUrl ?? FALLBACK_IMAGE,
    description: circuit.description ?? "",
    descriptionEn: circuit.descriptionEn ?? undefined,
    highlights: toStringArray(circuit.highlights),
    highlightsEn: toStringArray(circuit.highlightsEn),
    itinerary: toItinerary(circuit.itinerary),
    itineraryEn: toItinerary(circuit.itineraryEn),
    included: toStringArray(circuit.included),
    includedEn: toStringArray(circuit.includedEn),
    excluded: toStringArray(circuit.excluded),
    excludedEn: toStringArray(circuit.excludedEn),
  };
}

// ─────────────────────────────── Blog ───────────────────────────────

export function toBlogPostVM(post: BlogPostWithRelations): StaticBlogPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    titleEn: post.titleEn ?? undefined,
    category: post.category?.name ?? "Voyage",
    categoryEn: post.category?.nameEn ?? undefined,
    excerpt: post.excerpt ?? "",
    excerptEn: post.excerptEn ?? undefined,
    content: post.content ?? "",
    contentEn: post.contentEn ?? undefined,
    // readTime "N min" est identique en EN : pas de readTimeEn, le
    // repli du composant l'affiche tel quel.
    image: post.imageUrl ?? FALLBACK_IMAGE,
    date: toDateString(post.publishedAt ?? post.createdAt),
    author: post.author
      ? `${post.author.firstName} ${post.author.lastName}`.trim()
      : "Wonder Tours",
    readTime: post.readTime ? `${post.readTime} min` : "5 min",
  };
}

// ─────────────────────────────── Témoignages ───────────────────────────────

export function toTestimonialVM(testimonial: Testimonial): StaticTestimonial {
  return {
    id: testimonial.id,
    name: testimonial.name,
    country: testimonial.country ?? "",
    rating: testimonial.rating,
    text: testimonial.text,
    avatar: testimonial.avatarUrl ?? undefined,
    date: toDateString(testimonial.date),
  };
}
