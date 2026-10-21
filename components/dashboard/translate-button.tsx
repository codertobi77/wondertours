"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";

/** L'API /api/dashboard/translate accepte 20 textes maximum par requête. */
const MAX_TEXTS_PER_REQUEST = 20;

/**
 * Bouton « Traduire en anglais » des formulaires du dashboard : envoie les
 * champs FR au route handler protégé /api/dashboard/translate (DeepL) puis
 * remplit les champs EN via le callback `onTranslated`.
 *
 * Au-delà de 20 textes, les entrées sont envoyées en plusieurs requêtes
 * séquentielles (lots de 20) puis fusionnées en tout-ou-rien : si un lot
 * échoue, aucune traduction n'est appliquée.
 *
 * Sans DEEPL_API_KEY côté serveur, l'API répond 503 et le message s'affiche
 * sous le bouton (aucune traduction silencieuse).
 */
export function TranslateButton({
  fields,
  onTranslated,
  disabled,
}: {
  /** Clé libre → texte source à traduire. Les entrées vides sont ignorées. */
  fields: Record<string, string>;
  onTranslated: (results: Record<string, string>) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTranslate() {
    const entries = Object.entries(fields).filter(
      ([, value]) => value.trim().length > 0
    );
    if (entries.length === 0) {
      setError("Remplissez d'abord les champs français à traduire.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const merged: Record<string, string> = {};
      // Requêtes séquentielles de ≤20 textes (limite de l'API), fusionnées
      // en fin de parcours — échec d'un lot = rien n'est appliqué.
      for (let i = 0; i < entries.length; i += MAX_TEXTS_PER_REQUEST) {
        const chunk = Object.fromEntries(
          entries.slice(i, i + MAX_TEXTS_PER_REQUEST)
        );
        const response = await fetch("/api/dashboard/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: chunk, targetLocale: "en" }),
        });
        if (!response.ok) {
          setError(await readApiError(response));
          return;
        }
        const data = (await response.json()) as {
          texts: Record<string, string>;
        };
        Object.assign(merged, data.texts);
      }
      onTranslated(merged);
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTranslate}
        disabled={disabled || busy}
      >
        <Languages className="w-4 h-4 mr-2" />
        {busy ? "Traduction…" : "Traduire en anglais (DeepL)"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
