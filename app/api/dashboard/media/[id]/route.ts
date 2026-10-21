import { z } from "zod";
import {
  ok,
  notFound,
  parseBody,
  handleProtectedRoute,
  uuidSchema,
  prismaErrorResponse,
} from "@/lib/api/utils";
import {
  deleteMediaFile,
  updateMediaFile,
  MediaValidationError,
} from "@/lib/services/media";

/** Textes alternatifs éditables depuis la médiathèque (FR + EN). */
const mediaUpdateSchema = z.object({
  altText: z.string().trim().max(255).optional().nullable(),
  altTextEn: z.string().trim().max(255).optional().nullable(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/dashboard/media/[id]'>
) {
  return handleProtectedRoute(request, async (_session) => {
    const { id } = await ctx.params;
    if (!uuidSchema.safeParse(id).success) return notFound("Fichier introuvable");

    const [body, errorResponse] = await parseBody(request, mediaUpdateSchema);
    if (errorResponse) return errorResponse;

    try {
      // Ne toucher que les clés réellement envoyées.
      const media = await updateMediaFile(id, {
        ...(body.altText !== undefined ? { altText: body.altText } : {}),
        ...(body.altTextEn !== undefined ? { altTextEn: body.altTextEn } : {}),
      });
      return ok(media);
    } catch (error) {
      const prismaResponse = prismaErrorResponse(error);
      if (prismaResponse) return prismaResponse;
      throw error;
    }
  }, { roles: ["admin", "editor"] });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<'/api/dashboard/media/[id]'>
) {
  return handleProtectedRoute(request, async (_session) => {
    const { id } = await ctx.params;
    if (!uuidSchema.safeParse(id).success) return notFound("Fichier introuvable");

    try {
      const media = await deleteMediaFile(id);
      return ok({
        message: "Fichier supprimé",
        id,
        url: media.url,
      });
    } catch (error) {
      if (error instanceof MediaValidationError) {
        return notFound(error.message);
      }
      const prismaResponse = prismaErrorResponse(error);
      if (prismaResponse) return prismaResponse;
      throw error;
    }
  }, { roles: ["admin", "editor"] });
}
