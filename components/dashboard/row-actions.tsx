"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, Trash2, X, Clock, Archive, Eye, EyeOff, Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Formate la réponse d'erreur API {error, details?} en message lisible. */
async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      details?: { message?: string }[];
    };
    if (data.error) {
      const details = data.details?.map((d) => d.message).filter(Boolean);
      return details?.length ? `${data.error} : ${details.join(", ")}` : data.error;
    }
  } catch {
    // réponse non JSON
  }
  return `Erreur ${response.status}`;
}

/**
 * Actions par ligne des listes dashboard : lien d'édition optionnel,
 * changement de statut via PATCH et suppression optionnelle via DELETE,
 * suivis d'un router.refresh() pour re-rendre les Server Components avec
 * les données à jour.
 */
export function RowActions({
  id,
  resource,
  statusEndpoint,
  statuses,
  editHref,
  enableDelete = false,
  deleteLabel = "Supprimer",
  confirmMessage = "Confirmer la suppression ?",
}: {
  id: string;
  /** Ressource API, ex. "circuits" → DELETE /api/dashboard/circuits/[id]. Requis si enableDelete. */
  resource?: string;
  /** Endpoint complet du PATCH de statut (bookings/contact-requests). */
  statusEndpoint?: string;
  /** Statuts proposés ; PATCH { status } sur statusEndpoint ou resource/[id]. */
  statuses?: { value: string; label: string; icon?: LucideIcon; className?: string }[];
  /** Lien vers la page d'édition [id] correspondante (bouton crayon). */
  editHref?: string;
  /** Afficher le bouton de suppression (routes DELETE existantes uniquement). */
  enableDelete?: boolean;
  deleteLabel?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mutate(method: "PATCH" | "DELETE", url: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(status: string) {
    const endpoint =
      statusEndpoint ?? (resource ? `/api/dashboard/${resource}/${id}` : "");
    if (!endpoint) return;
    await mutate("PATCH", endpoint, { status });
  }

  async function handleDelete() {
    if (!resource) return;
    if (!window.confirm(confirmMessage)) return;
    await mutate("DELETE", `/api/dashboard/${resource}/${id}`);
  }

  const disabled = busy || isPending;

  return (
    <div className="flex items-center justify-end gap-2">
      {error && (
        <span className="text-xs text-red-600" title={error}>
          ⚠
        </span>
      )}
      {statuses?.map((status) => (
        <Button
          key={status.value}
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => handleStatus(status.value)}
          title={status.label}
          className={status.className}
        >
          {status.icon && <status.icon className="w-4 h-4" />}
        </Button>
      ))}
      {editHref && (
        <Button variant="ghost" size="sm" href={editHref} title="Modifier">
          <Pencil className="w-4 h-4" />
        </Button>
      )}
      {enableDelete && (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleDelete}
          title={deleteLabel}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

/** Actions statut prédéfinies pour les réservations. */
export const BOOKING_STATUS_ACTIONS = [
  { value: "confirmed", label: "Confirmer", icon: Check, className: "text-green-600 hover:text-green-700" },
  { value: "cancelled", label: "Annuler", icon: X, className: "text-red-600 hover:text-red-700" },
  { value: "completed", label: "Marquer terminé", icon: Archive },
] as const;

/** Actions statut prédéfinies pour les demandes de contact. */
export const CONTACT_STATUS_ACTIONS = [
  { value: "in_progress", label: "En cours", icon: Clock, className: "text-yellow-600 hover:text-yellow-700" },
  { value: "answered", label: "Répondre", icon: Check, className: "text-green-600 hover:text-green-700" },
  { value: "closed", label: "Clôturer", icon: Archive, className: "text-gray-600 hover:text-gray-700" },
] as const;

/**
 * Wrappers pour les pages serveur : les constantes *STATUS_ACTIONS ne sont
 * pas itérables côté serveur (références client), le spread doit donc
 * rester dans ce module client.
 */
export function BookingRowActions({ id }: { id: string }) {
  return (
    <RowActions
      id={id}
      statusEndpoint={`/api/dashboard/bookings/${id}/status`}
      statuses={[...BOOKING_STATUS_ACTIONS]}
    />
  );
}

export function ContactRowActions({ id }: { id: string }) {
  return (
    <RowActions
      id={id}
      statusEndpoint={`/api/dashboard/contact-requests/${id}/status`}
      statuses={[...CONTACT_STATUS_ACTIONS]}
    />
  );
}

/**
 * Bascule booléenne générique via PATCH (isActive pour la plupart des
 * entités, isPublished pour les articles de blog).
 */
export function ToggleFieldButton({
  resource,
  id,
  field = "isActive",
  value,
  activeTitle = "Désactiver",
  inactiveTitle = "Activer",
}: {
  /** Ressource API, ex. "circuits" → PATCH /api/dashboard/circuits/[id]. */
  resource: string;
  id: string;
  /** Champ basculé dans le body du PATCH. */
  field?: string;
  value: boolean;
  activeTitle?: string;
  inactiveTitle?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/${resource}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !value }),
      });
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      {error && (
        <span className="text-xs text-red-600" title={error}>
          ⚠
        </span>
      )}
      <Button variant="ghost" size="sm" disabled={busy} onClick={toggle} title={value ? activeTitle : inactiveTitle}>
        {value ? (
          <>
            <EyeOff className="w-4 h-4 mr-1" /> {activeTitle}
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-1" /> {inactiveTitle}
          </>
        )}
      </Button>
    </span>
  );
}
