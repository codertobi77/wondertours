import { z } from "zod";

/**
 * Version .partial() sans effets de bord : retire les .default() des champs
 * avant de les rendre optionnels. Sans cela, chaque PATCH réappliquerait
 * isActive: true, isFeatured: false, etc. même en leur absence du body.
 */
export function partialWithoutDefaults<T extends z.ZodObject>(schema: T) {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [
      key,
      field instanceof z.ZodDefault ? field.removeDefault() : field,
    ])
  );
  return z.object(shape).partial();
}

/** Pagination commune aux listes dashboard. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).optional(),
});

/** Booléen query optionnel (?active=true). */
export const boolQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

/** Date optionnelle YYYY-MM-DD ou chaîne vide (formulaire HTML). */
export const dateQuery = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const difficultySchema = z.enum(["easy", "moderate", "challenging"]);

/** Liste de chaînes non vides (highlights, included, excluded…). */
const stringListSchema = z.array(z.string().trim().min(1).max(500));

/** Journée d'itinéraire (programme jour par jour). */
const itineraryDaySchema = z.object({
  day: z.coerce.number().int().min(1),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const circuitCreateSchema = z.object({
  title: z.string().trim().min(3).max(255),
  titleEn: z.string().trim().max(255).optional().nullable(),
  subtitle: z.string().trim().max(2000).optional().nullable(),
  subtitleEn: z.string().trim().max(2000).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  descriptionEn: z.string().trim().max(10000).optional().nullable(),
  destinationId: z.string().uuid().optional().nullable(),
  // Multi-catégories (relation m-n) : ids des catégories du circuit.
  categoryIds: z.array(z.string().uuid()).max(10).optional().nullable(),
  durationDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  durationNights: z.coerce.number().int().min(0).max(364).optional().nullable(),
  price: z.coerce.number().min(0),
  currency: z.string().trim().length(3).default("XOF"),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  gallery: z.array(z.string().trim().min(1).max(500)).optional().nullable(),
  highlights: stringListSchema.optional().nullable(),
  highlightsEn: stringListSchema.optional().nullable(),
  itinerary: z.array(itineraryDaySchema).optional().nullable(),
  itineraryEn: z.array(itineraryDaySchema).optional().nullable(),
  included: stringListSchema.optional().nullable(),
  includedEn: stringListSchema.optional().nullable(),
  excluded: stringListSchema.optional().nullable(),
  excludedEn: stringListSchema.optional().nullable(),
  difficulty: difficultySchema.optional().nullable(),
  minParticipants: z.coerce.number().int().min(1).max(1000).optional().nullable(),
  maxParticipants: z.coerce.number().int().min(1).max(1000).optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const circuitUpdateSchema = partialWithoutDefaults(circuitCreateSchema);

export const destinationCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  descriptionEn: z.string().trim().max(10000).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  region: z.string().trim().max(100).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

export const destinationUpdateSchema = partialWithoutDefaults(destinationCreateSchema);

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  descriptionEn: z.string().trim().max(10000).optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale attendue")
    .optional()
    .nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const categoryUpdateSchema = partialWithoutDefaults(categoryCreateSchema);

export const testimonialCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  country: z.string().trim().max(100).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(5000),
  textEn: z.string().trim().max(5000).optional().nullable(),
  circuitId: z.string().uuid().optional().nullable(),
  avatarUrl: z.string().trim().max(500).optional().nullable(),
  date: dateQuery,
  isVerified: z.coerce.boolean().default(false),
  isFeatured: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const testimonialUpdateSchema = partialWithoutDefaults(testimonialCreateSchema);

export const serviceCreateSchema = z.object({
  title: z.string().trim().min(2).max(255),
  titleEn: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  descriptionEn: z.string().trim().max(10000).optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  href: z.string().trim().max(255).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const serviceUpdateSchema = partialWithoutDefaults(serviceCreateSchema);

export const blogPostCreateSchema = z.object({
  title: z.string().trim().min(3).max(255),
  titleEn: z.string().trim().max(255).optional().nullable(),
  excerpt: z.string().trim().max(2000).optional().nullable(),
  excerptEn: z.string().trim().max(2000).optional().nullable(),
  content: z.string().trim().min(10).max(100000).optional().nullable(),
  contentEn: z.string().trim().max(100000).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(50)).optional().nullable(),
  readTime: z.coerce.number().int().min(1).max(600).optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  isPublished: z.coerce.boolean().default(false),
});

export const blogPostUpdateSchema = partialWithoutDefaults(blogPostCreateSchema);

export const blogCategoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale attendue")
    .optional()
    .nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const blogCategoryUpdateSchema = partialWithoutDefaults(blogCategoryCreateSchema);
