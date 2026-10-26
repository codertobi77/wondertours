"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { TestimonialsContent } from "@/components/testimonials/testimonials-content";
import { useLanguage } from "@/contexts/language-context";
import { useRouter, useSearchParams } from "next/navigation";
import type { Testimonial } from "@/lib/data/testimonials";

interface TestimonialsPageContentProps {
  /** Tous les témoignages actifs, embarqués dans la page statique. */
  testimonials: Testimonial[];
  averageRating: number;
  totalTestimonials?: number;
  /** Témoignages par page (6, comme l'ancien rendu serveur). */
  pageSize?: number;
}

/**
 * Corps bilingue de la page « Témoignages » (stats, grille, CTA). La page
 * est statique : la pagination ?page= est gérée ici, côté client, sur la
 * liste complète transmise par la page. useSearchParams exige une
 * <Suspense> au-dessus (pré-rendu statique) — fournie par la page.
 */
export function TestimonialsPageContent({
  testimonials,
  averageRating,
  totalTestimonials = testimonials.length,
  pageSize = 6,
}: TestimonialsPageContentProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage =
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;

  const totalPages = Math.max(1, Math.ceil(testimonials.length / pageSize));
  const [page, setPage] = useState<number>(
    Math.min(Math.max(initialPage, 1), totalPages)
  );
  const currentPage = Math.min(page, totalPages);
  const paged = testimonials.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (newPage: number) => {
    const clamped = Math.min(Math.max(newPage, 1), totalPages);
    setPage(clamped);
    const params = new URLSearchParams(searchParams.toString());
    if (clamped > 1) {
      params.set("page", String(clamped));
    } else {
      params.delete("page");
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : window.location.pathname, { scroll: false });
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
      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-heading font-bold text-primary mb-2">
                {totalTestimonials}
              </div>
              <p className="text-text-secondary">
                {isFr ? "Témoignages" : "Testimonials"}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-5xl font-heading font-bold text-primary">
                  {averageRating.toFixed(1)}
                </span>
                <Star className="w-8 h-8 fill-secondary text-secondary" />
              </div>
              <p className="text-text-secondary">
                {isFr ? "Note moyenne" : "Average rating"}
              </p>
            </div>
            <div>
              <div className="text-5xl font-heading font-bold text-primary mb-2">
                20+
              </div>
              <p className="text-text-secondary">
                {isFr ? "Années d'expérience" : "Years of experience"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <SectionHeading
            title={
              isFr
                ? "Ils ont voyagé avec Wonder Tours and Services"
                : "They traveled with Wonder Tours and Services"
            }
          />
          <TestimonialsContent testimonials={paged} />
          {testimonials.length === 0 && (
            <p className="text-center text-text-secondary py-12">
              {isFr
                ? "Aucun témoignage pour le moment."
                : "No testimonials yet."}
            </p>
          )}

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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <SectionHeading
            title={
              isFr ? "Vous avez voyagé avec nous ?" : "Have you traveled with us?"
            }
          />
          <p className="text-text-secondary text-xl mb-8 max-w-2xl mx-auto">
            {isFr
              ? "Partagez votre expérience et aidez d'autres voyageurs à découvrir le Bénin avec Wonder Tours and Services."
              : "Share your experience and help other travelers discover Benin with Wonder Tours and Services."}
          </p>
          <Button variant="primary" size="lg" href="/contact">
            {isFr ? "Partager mon témoignage" : "Share my testimonial"}
          </Button>
        </div>
      </section>
    </>
  );
}
