/**
 * Helpers de formatage partagés entre les pages dashboard (rendu serveur).
 * Version "hydratable" : n'utilise pas Date.prototype.toLocaleDateString
 * pour rester identique serveur/client quand applicable.
 */

/** Date → "15 janv. 2024" ; null/undefined → "—". */
export function formatDate(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

/** Montant entier avec séparateurs de milliers, ex. "1 250 000 FCFA". */
export function formatFcfa(amount: number | null | undefined): string {
  return `${new Intl.NumberFormat("fr-FR").format(Number(amount ?? 0))} FCFA`;
}

/** Octets → "2,4 Mo" / "850 Ko". */
export function formatFileSize(bytes: number | bigint | null): string {
  const value = Number(bytes ?? 0);
  if (value <= 0) return "0 o";
  if (value < 1024) return `${value} o`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} Ko`;
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/** Découpe un textarea "un par ligne" en tableau de chaînes propres. */
export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * "Jour 1 : Titre — description" → { day, title, description }.
 * Le numéro de jour est la position de la ligne ; " : " sépare titre et
 * description. Lignes sans " : " : tout est titre.
 */
export function parseItineraryLines(value: string): {
  day: number;
  title: string;
  description: string;
}[] {
  return splitLines(value).map((line, index) => {
    const separator = line.indexOf(" : ");
    if (separator === -1) {
      return { day: index + 1, title: line, description: "" };
    }
    return {
      day: index + 1,
      title: line.slice(0, separator),
      description: line.slice(separator + 3),
    };
  });
}

/** Inverse de splitLines : tableau de chaînes → texte « un par ligne ». */
export function joinLines(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

/**
 * Inverse de parseItineraryLines : { day, title, description }[] →
 * lignes « Titre : description » prêtes à remplir un textarea.
 */
export function formatItineraryLines(
  days: { day: number; title: string; description?: string | null }[]
): string {
  return days
    .map((d) => (d.description ? `${d.title} : ${d.description}` : d.title))
    .join("\n");
}

/** Découpe "histoire, bénin, culture" → ["histoire", "bénin", "culture"]. */
export function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
