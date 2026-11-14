"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

/**
 * Hook pour debounce une valeur.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Champ de recherche des listes dashboard — contrôlé : la page détient la
 * valeur (état local) et filtre la liste côté client (fetch unique
 * pageSize=100), plus d'aller-retour ?q= serveur depuis l'export statique.
 * Le debounce (300ms) évite les re-renders excessifs lors de la frappe.
 */
export function SearchInput({
  placeholder,
  value,
  onChange,
  debounceMs = 300,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}) {
  const debouncedValue = useDebounce(value, debounceMs);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Effacer la recherche"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
