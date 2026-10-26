import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/** Blocs d'état partagés des pages dashboard client (chargement, erreur, 404). */

export function LoadingBlock() {
  return (
    <p className="text-gray-500 py-16 text-center" role="status">
      Chargement…
    </p>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      {message}
    </p>
  );
}

/** Ressource introuvable (404 API) — retour à la liste dashboard. */
export function MissingBlock({ label }: { label: string }) {
  return (
    <div className="text-center py-16 space-y-4">
      <p className="text-gray-600">{label} introuvable.</p>
      <Button variant="outline" href="/dashboard">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour au tableau de bord
      </Button>
    </div>
  );
}
