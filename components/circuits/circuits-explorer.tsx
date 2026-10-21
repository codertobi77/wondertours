"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircuitCard } from "@/components/circuits/circuit-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Circuit } from "@/lib/data/circuits";

interface CircuitsExplorerProps {
  circuits: Circuit[];
  categories: string[];
  destinations: string[];
  initialCategory?: string;
  currentPage?: number;
  totalPages?: number;
}

export function CircuitsExplorer({
  circuits,
  categories,
  destinations,
  initialCategory = "all",
  currentPage = 1,
  totalPages = 1,
}: CircuitsExplorerProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedDestination, setSelectedDestination] = useState<string>("all");

  const filteredCircuits = circuits.filter((circuit) => {
    if (selectedCategory !== "all" && !circuit.categories.includes(selectedCategory)) {
      return false;
    }
    if (selectedDestination !== "all" && circuit.destination !== selectedDestination) {
      return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedDestination("all");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
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
                onClick={() => setSelectedCategory("all")}
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
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-text hover:bg-amber-100 hover:text-amber-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDestination("all")}
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
                  key={destination}
                  onClick={() => setSelectedDestination(destination)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedDestination === destination
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-text hover:bg-amber-100 hover:text-amber-700"
                  }`}
                >
                  {destination}
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
                {filteredCircuits.map((circuit) => (
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

                  {getPageNumbers().map((page, index) => (
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-text-secondary">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(page as number)}
                        className={currentPage === page ? "bg-amber-600 hover:bg-amber-700" : ""}
                      >
                        {page}
                      </Button>
                    )
                  ))}

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
