"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircuitCard } from "@/components/circuits/circuit-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Circuit } from "@/lib/data/circuits";

interface Option {
  name: string;
  slug: string;
}

interface CircuitsExplorerProps {
  /** Tous les circuits actifs, embarqués dans la page statique. */
  circuits: Circuit[];
  categories: Option[];
  destinations: Option[];
  /** Taille de page (6 par défaut, comme l'ancien rendu serveur). */
  pageSize?: number;
}

/**
 * Explorateur de circuits — filtrage et pagination 100 % côté client :
 * la page /circuits est statique (export), le serveur ne refiltre plus
 * ?category=/?page=. L'état initial vient de l'URL (partageable), les
 * clics mettent à jour les filtres ET l'URL (router.replace, sans
 * historique).
 *
 * useSearchParams exige une <Suspense> au-dessus (pré-rendu statique) —
 * fournie par la page.
 */
export function CircuitsExplorer({
  circuits,
  categories,
  destinations,
  pageSize = 6,
}: CircuitsExplorerProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const router = useRouter();
  const searchParams = useSearchParams();

  // État initial depuis l'URL : ?category=<slug> et ?page=N.
  const initialCategorySlug = searchParams.get("category") ?? "";
  const initialPage =
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;

  // Le filtre compare des NOMS (les cards affichent des noms) ; le slug de
  // l'URL est résolu via la liste des catégories transmise par la page.
  const initialCategory =
    categories.find((c) => c.slug === initialCategorySlug)?.name ?? "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedDestination, setSelectedDestination] = useState<string>("all");
  const [page, setPage] = useState<number>(Math.max(initialPage, 1));

  const filteredCircuits = circuits.filter((circuit) => {
    if (selectedCategory !== "all" && !circuit.categories.includes(selectedCategory)) {
      return false;
    }
    if (selectedDestination !== "all" && circuit.destination !== selectedDestination) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCircuits.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedCircuits = filteredCircuits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /** Met à jour l'URL (?category=, ?page=) sans polluer l'historique. */
  const syncUrl = (categorySlug: string | null, page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : window.location.pathname, { scroll: false });
  };

  const selectCategory = (name: string, slug: string | null) => {
    setSelectedCategory(name);
    setPage(1);
    syncUrl(slug, 1);
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedDestination("all");
    setPage(1);
    syncUrl(null, 1);
  };

  const handlePageChange = (newPage: number) => {
    const clamped = Math.min(Math.max(newPage, 1), totalPages);
    setPage(clamped);
    syncUrl(
      categories.find((c) => c.name === selectedCategory)?.slug ?? null,
      clamped
    );
  };

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      {/* Filters Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectCategory("all", null)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-text hover:bg-amber-100 hover:text-amber-700"
                }`}
              >
                {isFr ? "Toutes les catégories" : "All categories"}
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => selectCategory(category.name, category.slug)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === category.name
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-text hover:bg-amber-100 hover:text-amber-700"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedDestination("all");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedDestination === "all"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-text hover:bg-amber-100 hover:text-amber-700"
                }`}
              >
                {isFr ? "Toutes les destinations" : "All destinations"}
              </button>
              {destinations.map((destination) => (
                <button
                  key={destination.slug}
                  onClick={() => {
                    setSelectedDestination(destination.name);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedDestination === destination.name
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-text hover:bg-amber-100 hover:text-amber-700"
                  }`}
                >
                  {destination.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Circuits Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <p className="text-text-secondary">
              {isFr
                ? `${filteredCircuits.length} circuit${filteredCircuits.length > 1 ? "s" : ""} trouvé${filteredCircuits.length > 1 ? "s" : ""}`
                : `${filteredCircuits.length} tour${filteredCircuits.length > 1 ? "s" : ""} found`}
            </p>
          </div>

          {filteredCircuits.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pagedCircuits.map((circuit) => (
                  <CircuitCard key={circuit.id} circuit={circuit} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((item, index) =>
                    item === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-text-secondary">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={currentPage === item ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(item)}
                        className={currentPage === item ? "bg-amber-600 hover:bg-amber-700" : ""}
                      >
                        {item}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-text-secondary text-xl mb-6">
                {isFr
                  ? "Aucun circuit ne correspond à vos critères."
                  : "No tours match your criteria."}
              </p>
              <Button variant="outline" onClick={resetFilters}>
                {isFr ? "Réinitialiser les filtres" : "Reset filters"}
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
