"use client";


interface ProgressBarProps {
  /** Affiche la barre quand true. */
  active: boolean;
  /** Texte optionnel affiché à côté. */
  label?: string;
  /** Classe supplémentaire pour le conteneur. */
  className?: string;
}

/**
 * Barre de progression non bloquante (indéterminée) — fine bande animée
 * affichée pendant une opération asynchrone (enregistrement, publication).
 * Ne bloque pas l'interface : l'utilisateur peut continuer à interagir.
 */
export function ProgressBar({ active, label, className = "" }: ProgressBarProps) {
  if (!active) return null;

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-busy={active}>
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-amber-600 rounded-full transition-all duration-300 ${
            active ? "animate-progress-indeterminate" : "w-full opacity-0"
          }`}
          style={active ? undefined : { width: "100%" }}
        />
      </div>
      {label && (
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      )}
    </div>
  );
}
