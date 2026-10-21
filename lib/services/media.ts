import { prisma, Prisma, type MediaFile } from "@/lib/db";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  isImgbbConfigured,
  uploadToImgbb,
} from "@/lib/services/imgbb";

// ─────────────────────────────── Constantes ───────────────────────────────

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

export class MediaValidationError extends Error {}

// ─────────────────────────────── Lecture ───────────────────────────────

export interface MediaListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  mimeType?: string;
}

export async function listMediaFiles(
  filters: MediaListFilters = {}
): Promise<{
  items: MediaFile[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.MediaFileWhereInput = {
    ...(filters.mimeType && { mimeType: filters.mimeType }),
    ...(filters.q && {
      OR: [
        { filename: { contains: filters.q, mode: "insensitive" } },
        { altText: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.mediaFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mediaFile.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getMediaFileById(id: string): Promise<MediaFile | null> {
  return prisma.mediaFile.findUnique({ where: { id } });
}

// ─────────────────────────────── Upload ───────────────────────────────

export interface UploadMediaInput {
  file: File;
  altText?: string | null;
  altTextEn?: string | null;
  uploadedBy?: string | null;
}

/**
 * Enregistre le fichier en base avec ses métadonnées.
 * Abstraction stockage : imgBB distant si `IMGBB_API_KEY` est définie
 * (persistant en production), sinon public/uploads/ en local (dev/tests).
 * `storagePath` vaut le chemin FS local, ou le `delete_url` imgBB (référence
 * — imgBB n'a pas d'API de suppression).
 */
export async function uploadMedia(input: UploadMediaInput): Promise<MediaFile> {
  const { file } = input;

  if (file.size === 0) {
    throw new MediaValidationError("Fichier vide");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new MediaValidationError("Fichier trop volumineux (max 5 Mo)");
  }
  const mimeType = file.type || null;
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new MediaValidationError(
      `Type de fichier non autorisé (${mimeType ?? "inconnu"})`
    );
  }

  // Nom de fichier sûr : alphanumérique + tirets, préfixe unique.
  const safeName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);
  const uniqueName = `${Date.now()}-${safeName}`;

  let url: string;
  let storagePath: string;

  if (isImgbbConfigured()) {
    // Stockage distant imgBB : persistant sur Vercel (FS en lecture seule).
    const uploaded = await uploadToImgbb(file);
    url = uploaded.url;
    storagePath = uploaded.deleteUrl;
  } else {
    // Stockage local (dev / tests sans IMGBB_API_KEY).
    await mkdir(UPLOAD_DIR, { recursive: true });
    const destPath = path.join(UPLOAD_DIR, uniqueName);
    await writeFile(destPath, Buffer.from(await file.arrayBuffer()));
    url = `/uploads/${uniqueName}`;
    storagePath = destPath;
  }

  return prisma.mediaFile.create({
    data: {
      filename: file.name,
      storagePath,
      url,
      mimeType,
      size: BigInt(file.size),
      altText: input.altText ?? null,
      altTextEn: input.altTextEn ?? null,
      uploadedBy: input.uploadedBy ?? null,
    },
  });
}

// ─────────────────────────────── Mise à jour ───────────────────────────────

export interface UpdateMediaInput {
  altText?: string | null;
  altTextEn?: string | null;
}

/** Met à jour les textes alternatifs (FR/EN) d'un média existant. */
export async function updateMediaFile(
  id: string,
  data: UpdateMediaInput
): Promise<MediaFile> {
  return prisma.mediaFile.update({ where: { id }, data });
}

// ─────────────────────────────── Suppression ───────────────────────────────

/** Supprime la ligne en base et le fichier physique (si existant). */
export async function deleteMediaFile(id: string): Promise<MediaFile> {
  const media = await prisma.mediaFile.findUnique({ where: { id } });
  if (!media) {
    throw new MediaValidationError("Fichier média introuvable");
  }

  await prisma.mediaFile.delete({ where: { id } });

  // Fichier distant imgBB (delete_url, pas un chemin FS) : imgBB n'expose
  // pas d'API de suppression — seule la ligne est retirée de la médiathèque.
  if (!path.isAbsolute(media.storagePath)) {
    return media;
  }

  try {
    await unlink(media.storagePath);
  } catch (error) {
    // Fichier déjà absent : non bloquant, la ligne est supprimée.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[media] Échec suppression fichier:", error);
    }
  }

  return media;
}
