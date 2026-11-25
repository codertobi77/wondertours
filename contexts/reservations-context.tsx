"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, ReactNode } from "react";

export interface ReservationItem {
  id: string;
  type: "circuit" | "sejour" | "hotel";
  title: string;
  price: number;
  currency?: string;
  image: string;
  date: string;
  userId: string;
}

interface ReservationsContextType {
  reservations: ReservationItem[];
  addReservation: (item: Omit<ReservationItem, "id" | "userId">) => void;
  removeReservation: (id: string) => void;
  clearReservations: () => void;
  getCurrentUserReservations: () => ReservationItem[];
}

const STORAGE_KEY = "reservations";
const EMPTY_RESERVATIONS: ReservationItem[] = [];

const ReservationsContext = createContext<ReservationsContextType | undefined>(undefined);

// Simuler un ID utilisateur (en production, cela viendrait de l'auth)
const getCurrentUserId = () => {
  if (typeof window === "undefined") return "default_user";
  const storedUserId = localStorage.getItem("userId");
  if (storedUserId) return storedUserId;
  const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("userId", newUserId);
  return newUserId;
};

// Store externe localStorage consommé via useSyncExternalStore :
// évite tout setState dans un effet et synchronise les autres onglets ("storage").
let cachedReservations: ReservationItem[] | null = null;
const listeners = new Set<() => void>();

const readReservations = (): ReservationItem[] => {
  if (typeof window === "undefined") return EMPTY_RESERVATIONS;
  if (cachedReservations === null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      cachedReservations = stored
        ? (JSON.parse(stored) as ReservationItem[])
        : EMPTY_RESERVATIONS;
    } catch {
      cachedReservations = EMPTY_RESERVATIONS;
    }
  }
  return cachedReservations;
};

const writeReservations = (items: ReservationItem[]) => {
  cachedReservations = items;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener());
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cachedReservations = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = (): ReservationItem[] => readReservations();
const getServerSnapshot = (): ReservationItem[] => EMPTY_RESERVATIONS;

export function ReservationsProvider({ children }: { children: ReactNode }) {
  const allReservations = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const addReservation = useCallback((item: Omit<ReservationItem, "id" | "userId">) => {
    const userId = getCurrentUserId();
    const newReservation: ReservationItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
    };
    writeReservations([...readReservations(), newReservation]);
  }, []);

  const removeReservation = useCallback((id: string) => {
    writeReservations(readReservations().filter((r) => r.id !== id));
  }, []);

  const clearReservations = useCallback(() => {
    const userId = getCurrentUserId();
    writeReservations(readReservations().filter((r) => r.userId !== userId));
  }, []);

  const getCurrentUserReservations = useCallback(() => {
    const userId = getCurrentUserId();
    return allReservations.filter((r) => r.userId === userId);
  }, [allReservations]);

  return (
    <ReservationsContext.Provider
      value={{
        reservations: getCurrentUserReservations(),
        addReservation,
        removeReservation,
        clearReservations,
        getCurrentUserReservations,
      }}
    >
      {children}
    </ReservationsContext.Provider>
  );
}

export function useReservations() {
  const context = useContext(ReservationsContext);
  if (context === undefined) {
    throw new Error("useReservations must be used within a ReservationsProvider");
  }
  return context;
}
