"use client";

/**
 * Client HTTP du dashboard — l'API PHP est servie sur LWS Perso
 * (https://api.wondertoursandservices.com) et jointe via le proxy Vercel
 * (/api/* → api.wondertoursandservices.com). Depuis le navigateur, les
 * appels sont de même origine : pas de CORS requis, le cookie wt_session
 * est envoyé avec chaque requête.
 *
 * L'autorisation réelle reste côté API (chaque requête y est re-vérifiée
 * via le cookie wt_session) ; le client ne fait qu'afficher et rediriger.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiAuthPayload } from "@/lib/api-types";
import type { Session } from "@/lib/auth";

/** Erreur API : statut HTTP + message lisible ({error, details?} du contrat). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** fetch JSON vers l'API (chemin relatif /api/*, proxy par Vercel). */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const data = (await response.json()) as {
        error?: string;
        details?: { message?: string }[];
      };
      if (data.error) {
        const details = data.details
          ?.map((detail) => detail.message)
          .filter(Boolean);
        message = details?.length
          ? `${data.error} : ${details.join(", ")}`
          : data.error;
      }
    } catch {
      // réponse non JSON
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export interface ApiData<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Statut HTTP du dernier GET (null tant que la 1ʳᵉ réponse n'est pas là). */
  status: number | null;
  /** Rejoue le GET (après une mutation de ligne, un upload…). */
  reload: () => void;
}

/**
 * GET + état de chargement. 401 (session expirée/absente) → redirection
 * vers /dashboard/login.
 */
export function useApiData<T>(path: string): ApiData<T> {
  const router = useRouter();
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
    status: number | null;
  }>({ data: null, error: null, loading: true, status: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false, status: 200 });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/dashboard/login");
          return;
        }
        setState({
          data: null,
          error: error instanceof ApiError ? error.message : "Erreur réseau",
          loading: false,
          status: error instanceof ApiError ? error.status : null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [path, nonce, router]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  return { ...state, reload };
}

/** Session courante via GET /api/auth/me — garde client du layout dashboard. */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ApiAuthPayload>("/api/auth/me")
      .then(({ user }) => {
        if (!cancelled) {
          setSession({
            sub: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, loading };
}

/**
 * Filtre local des listes dashboard (fetch unique pageSize=100, comme
 * l'ancien refilter serveur via ?q=) : vrai si un champ contient la
 * recherche (insensible à la casse), vide = tout afficher.
 */
export function matchesQuery(
  q: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}