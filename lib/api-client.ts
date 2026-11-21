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

/** En-tête Authorization depuis le jeton stocké (repli si cookie absent). */
function authHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem("wt_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** fetch JSON vers l'API (chemin relatif /api/*, proxy par Vercel). */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...authHeader(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
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
export function useSession(enabled = true): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  return { session, loading };
}

/**
 * Hook pour les données paginées.
 * Gère le chargement, la pagination, le tri et les filtres.
 */
export interface PaginatedApiData<T> {
  data: T[] | null;
  error: string | null;
  loading: boolean;
  status: number | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  reload: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (filters: Record<string, unknown>) => void;
}

export function usePaginatedApiData<T>(
  basePath: string,
  initialPageSize = 20
): PaginatedApiData<T> {
  const router = useRouter();
  const [state, setState] = useState<{
    items: T[] | null;
    total: number;
    page: number;
    pageSize: number;
    error: string | null;
    loading: boolean;
    status: number | null;
    filters: Record<string, unknown>;
  }>({
    items: null,
    total: 0,
    page: 1,
    pageSize: initialPageSize,
    error: null,
    loading: true,
    status: null,
    filters: {},
  });
  const [nonce, setNonce] = useState(0);

  const buildPath = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(state.page));
    params.set("pageSize", String(state.pageSize));
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    return `${basePath}?${params.toString()}`;
  }, [basePath, state.page, state.pageSize, state.filters]);

  useEffect(() => {
    let cancelled = false;
    const path = buildPath();
    apiFetch<{ items: T[]; total: number }>(path)
      .then((data) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            items: data.items,
            total: data.total,
            loading: false,
            status: 200,
            error: null,
          }));
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/dashboard/login");
          return;
        }
        setState((prev) => ({
          ...prev,
          items: null,
          total: 0,
          error: error instanceof ApiError ? error.message : "Erreur réseau",
          loading: false,
          status: error instanceof ApiError ? error.status : null,
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [buildPath, nonce, router]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page: Math.max(1, page), loading: true, error: null }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({
      ...prev,
      pageSize: Math.max(1, Math.min(100, pageSize)),
      page: 1,
      loading: true,
      error: null,
    }));
  }, []);

  const setFilters = useCallback((filters: Record<string, unknown>) => {
    setState((prev) => ({
      ...prev,
      filters,
      page: 1,
      loading: true,
      error: null,
    }));
  }, []);

  return {
    data: state.items,
    error: state.error,
    loading: state.loading,
    status: state.status,
    total: state.total,
    page: state.page,
    pageSize: state.pageSize,
    totalPages: Math.ceil(state.total / state.pageSize),
    reload,
    setPage,
    setPageSize,
    setFilters,
  };
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