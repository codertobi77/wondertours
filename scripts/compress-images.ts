/**
 * Compression des images du site — Phase 1b du plan de migration.
 * « Auto-compresser les images, y compris les préexistantes. »
 *
 * Parcourt public/** et recomprime en place :
 *   - JPEG  → mozjpeg qualité 80
 *   - PNG   → palette qualité 90 (photos en PNG : gain massif)
 *   - WebP  → qualité 80
 *   - redimensionnés à 1920 px max (sans agrandissement), EXIF appliqué
 *   - SVG et GIF ignorés ; < 100 Ko ignorés (déjà légers)
 *
 * Idempotent : scripts/.image-compression.json mémorise la taille de chaque
 * fichier après traitement. Un fichier inchangé depuis (même taille exacte)
 * n'est jamais recompressé — aucune perte de génération au fil des runs,
 * y compris en CI. Un fichier modifié/remplacé est retraité.
 *
 * Usage :
 *   bun scripts/compress-images.ts          # compresse réellement
 *   bun scripts/compress-images.ts --dry    # simulation, rien n'est écrit
 */
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MARKER_PATH = path.join(SCRIPT_DIR, ".image-compression.json");
const DRY = process.argv.includes("--dry");
const MAX_DIMENSION = 1920;
const SKIP_BELOW_BYTES = 100 * 1024;
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

/** relPath → taille (octets) après dernier traitement. */
type Marker = Record<string, number>;

const fmt = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} Mo`
    : `${Math.round(bytes / 1024)} Ko`;

async function loadMarker(): Promise<Marker> {
  try {
    return JSON.parse(await readFile(MARKER_PATH, "utf8")) as Marker;
  } catch {
    return {};
  }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (IMAGE_RE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const marker = await loadMarker();
  const files = (await walk(PUBLIC_DIR)).sort();
  let processed = 0;
  let saved = 0;
  let unchanged = 0;
  let keptOriginal = 0;
  let failed = 0;

  for (const abs of files) {
    const rel = path.relative(process.cwd(), abs);
    const before = (await stat(abs)).size;

    if (before < SKIP_BELOW_BYTES) {
      unchanged++;
      continue;
    }
    if (marker[rel] === before) {
      unchanged++;
      continue;
    }

    let output: Buffer;
    try {
      const meta = await sharp(abs).metadata();
      let pipeline = sharp(abs).rotate(); // applique l'orientation EXIF
      if ((meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION) {
        pipeline = pipeline.resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        });
      }
      if (/\.jpe?g$/i.test(abs)) {
        output = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      } else if (/\.png$/i.test(abs)) {
        output = await pipeline
          .png({ palette: true, quality: 90, compressionLevel: 9 })
          .toBuffer();
      } else {
        output = await pipeline.webp({ quality: 80 }).toBuffer();
      }
    } catch (error) {
      console.warn(`⚠ ${rel} : non traitée (${(error as Error).message})`);
      failed++;
      continue;
    }

    // Rien à gagner : on marque la taille d'origine pour ne pas retenter.
    if (output.length >= before) {
      marker[rel] = before;
      keptOriginal++;
      continue;
    }

    saved += before - output.length;
    processed++;
    console.log(
      `${rel} : ${fmt(before)} → ${fmt(output.length)}${DRY ? " (dry-run)" : ""}`
    );

    if (!DRY) {
      await writeFile(abs, output);
      marker[rel] = output.length;
    }
  }

  if (!DRY) {
    await writeFile(MARKER_PATH, `${JSON.stringify(marker, null, 2)}\n`);
  }

  console.log(
    `\n${DRY ? "[DRY-RUN] " : ""}${processed} image(s) compressée(s), ` +
      `${fmt(saved)} économisés ; ${unchanged} ignorée(s) (légères/déjà traitées), ` +
      `${keptOriginal} sans gain, ${failed} en erreur.`
  );
}

main().catch((error) => {
  console.error("Échec de la compression :", error);
  process.exit(1);
});
