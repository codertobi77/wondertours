import {
  ok,
  created,
  parseBody,
  parseQuery,
  handleProtectedRoute,
} from "@/lib/api/utils";
import { listQuerySchema, circuitCreateSchema } from "@/lib/api/schemas";
import { listCircuits, createCircuit } from "@/lib/services/circuits";
import { uniqueSlug } from "@/lib/slug";
import { DbNull } from "@/lib/db";

/** Champs Json : null → DbNull (convention Prisma 7). */
function json<T>(value: T | null | undefined): T | typeof DbNull {
  return (value ?? DbNull) as T | typeof DbNull;
}

export async function GET(request: Request) {
  return handleProtectedRoute(request, async (_session) => {
    const [query, errorResponse] = parseQuery(request, listQuerySchema);
    if (errorResponse) return errorResponse;

    const result = await listCircuits({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      // Dashboard : toutes lignes, actives ou non.
    });
    return ok(result);
  });
}

export async function POST(request: Request) {
  return handleProtectedRoute(request, async (_session) => {
    const [body, errorResponse] = await parseBody(request, circuitCreateSchema);
    if (errorResponse) return errorResponse;

    const circuit = await createCircuit({
      slug: await uniqueSlug("circuit", body.title),
      title: body.title,
      titleEn: body.titleEn ?? null,
      subtitle: body.subtitle ?? null,
      subtitleEn: body.subtitleEn ?? null,
      description: body.description ?? null,
      descriptionEn: body.descriptionEn ?? null,
      destinationId: body.destinationId ?? null,
      // Multi-catégories : connecter chaque catégorie sélectionnée.
      categories: body.categoryIds?.length
        ? { connect: body.categoryIds.map((categoryId) => ({ id: categoryId })) }
        : undefined,
      durationDays: body.durationDays ?? null,
      durationNights: body.durationNights ?? null,
      price: body.price,
      currency: body.currency,
      imageUrl: body.imageUrl ?? null,
      gallery: json(body.gallery),
      highlights: json(body.highlights),
      highlightsEn: json(body.highlightsEn),
      itinerary: json(body.itinerary),
      itineraryEn: json(body.itineraryEn),
      included: json(body.included),
      includedEn: json(body.includedEn),
      excluded: json(body.excluded),
      excludedEn: json(body.excludedEn),
      difficulty: body.difficulty ?? null,
      minParticipants: body.minParticipants ?? null,
      maxParticipants: body.maxParticipants ?? null,
      isFeatured: body.isFeatured,
      isActive: body.isActive,
    });

    return created(circuit);
  }, { roles: ["admin", "editor"] });
}
