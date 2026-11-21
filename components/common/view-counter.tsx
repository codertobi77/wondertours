"use client";

import { useEffect } from "react";

/**
 * Compteur de vues d'un article de blog.
 *
 * L'API PHP incrémente `views` sur GET /api/blog/{slug} (comme la stack
 * Next le faisait au rendu serveur). La page est désormais statique : le
 * GET n'a plus lieu qu'au build — ce composant rejoue l'appel côté
 * navigateur à chaque visite pour conserver le compteur.
 *
 * Utilise sessionStorage pour éviter les doubles comptes dans la même session.
 * Fire-and-forget : les erreurs sont ignorées (best effort).
 */
export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const storageKey = `blog_view_${slug}`;

    // Vérifier si on a déjà compté cette vue dans la session actuelle
    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) {
      return;
    }

    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(() => {
        // Marquer comme compté pour cette session
        if (typeof window !== "undefined") {
          sessionStorage.setItem(storageKey, "1");
        }
      })
      .catch(() => {
        // best effort — ignoré
      });
  }, [slug]);

  return null;
}