import {
  ok,
  notFound,
  parseBody,
  handleProtectedRoute,
} from "@/lib/api/utils";
import { uuidSchema, prismaErrorResponse } from "@/lib/api/utils";
import { circuitUpdateSchema } from "@/lib/api/schemas";
import {
  getCircuitById,
  updateCircuit,
  deleteCircuit,
} from "@/lib/services/circuits";
import { uniqueSlug } from "@/lib/slug";
import { DbNull } from "@/lib/db";

export async function GET(
  request: Request,
  ctx: RouteContext<'/api/dashboard/circuits/[id]'>
) {
  return handleProtectedRoute(request, async (_session) => {
    const { id } = await ctx.params;
    if (!uuidSchema.safeParse(id).success) return notFound("Circuit introuvable");
    const circuit = await getCircuitById(id);
    if (!circuit) return notFound("Circuit introuvable");
    return ok(circuit);
  });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/dashboard/circuits/[id]'>
) {
  return handleProtectedRoute(request, async (_session) => {
    const { id } = await ctx.params;
    if (!uuidSchema.safeParse(id).success) return notFound("Circuit introuvable");

    const [body, errorResponse] = await parseBody(request, circuitUpdateSchema);
    if (errorResponse) return errorResponse;

    const updates: Record<string, unknown> = { ...body };
    // Multi-catégories : categoryIds → relation categories (set = remplace tout,
    // tableau vide = retire toutes les catégories, null = purge).
    delete updates.categoryIds;
    if (body.categoryIds !== undefined) {
      const categoryIds: string[] = body.categoryIds ?? [];
      updates.categories = {
        set: categoryIds.map((categoryId) => ({ id: categoryId })),
      };
    }
    // Si le titre change, régénérer un slug unique (sauf si explicite).
    if (body.title) {
      updates.slug = await uniqueSlug("circuit", body.title, id);
    }
    // Champs Json : null → DbNull (convention Prisma 7).
    for (const field of [
      "gallery", "highlights", "highlightsEn",
      "itinerary", "itineraryEn",
      "included", "includedEn",
      "excluded", "excludedEn",
    ]) {
      if (field in updates && (updates[field] === null || updates[field] === undefined)) {
        updates[field] = DbNull;
      }
    }

    try {
      const circuit = await updateCircuit(id, updates);
      return ok(circuit);
    } catch (error) {
      const prismaResponse = prismaErrorResponse(error);
      if (prismaResponse) return prismaResponse;
      throw error;
    }
  }, { roles: ["admin", "editor"] });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<'/api/dashboard/circuits/[id]'>
) {
  return handleProtectedRoute(request, async (_session) => {
    const { id } = await ctx.params;
    if (!uuidSchema.safeParse(id).success) return notFound("Circuit introuvable");

    const circuit = await getCircuitById(id);
    if (!circuit) return notFound("Circuit introuvable");

    try {
      await deleteCircuit(id);
    } catch (error) {
      const prismaResponse = prismaErrorResponse(error);
      if (prismaResponse) return prismaResponse;
      throw error;
    }
    return ok({ message: "Circuit supprimé", id });
  }, { roles: ["admin", "editor"] });
}
