/**
 * Utilitaire de sanitization HTML basique pour dangerouslySetInnerHTML.
 * N'autorise que les tags sûrs : <br>, <strong>, <em>, <b>, <i>, <span>
 * et supprime tous les attributs.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Tags autorisés avec leurs attributs (aucun attribut autorisé pour la sécurité)
  const allowedTags = ["br", "strong", "em", "b", "i", "span", "p"];

  // Remplacer les tags non autorisés par leur contenu texte
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, closing, tagName) => {
      const lowerTag = tagName.toLowerCase();
      if (allowedTags.includes(lowerTag)) {
        // Pour les tags autorisés, ne garder que le nom du tag sans attributs
        return `<${closing}${lowerTag}>`;
      }
      // Tag non autorisé : supprimer le tag mais garder le contenu
      return "";
    })
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Supprimer les handlers d'événements
    .replace(/javascript:/gi, ""); // Supprimer les URLs javascript:
}

/**
 * Version plus stricte : n'autorise que <br> pour les sauts de ligne
 */
export function sanitizeHtmlBrOnly(html: string): string {
  if (!html) return "";

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, closing, tagName) => {
      const lowerTag = tagName.toLowerCase();
      if (lowerTag === "br") {
        return `<${closing}br>`;
      }
      return "";
    })
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}