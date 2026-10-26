"use client";

import { useEffect } from "react";

/**
 * Compteur de vues d'un article de blog.
 *
 * L'API PHP incrémente `views` sur GET /api/blog/{slug} (comme la stack
 * Next le faisait au rendu serveur). La page est désormais statique : le
 * GET n'a plus lieu qu'au build — ce composant rejoue l'appel côté
 * navigateur à chaque visite pour conserver le compteur.
 * Fire-and-forget : les erreurs sont ignorées (best effort).
 */
export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/blog/${encodeURIComponent(slug)}`).catch(() => {
      // best effort — ignoré
    });
  }, [slug]);

  return null;
}
