"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star } from "lucide-react";
import { matchesQuery, useApiData } from "@/lib/api-client";
import { RowActions } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import { formatDate } from "@/lib/format";
import type { ApiPage, ApiTestimonial } from "@/lib/api-types";

export default function TestimonialsPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiTestimonial>>(
    "/api/dashboard/testimonials?pageSize=100"
  );
  const [q, setQ] = useState("");

  const testimonials = (data?.items ?? []).filter((testimonial) =>
    matchesQuery(q, testimonial.name, testimonial.text)
  );
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Témoignages</h1>
          <p className="text-gray-600 mt-1">
            {total} témoignage{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/dashboard/testimonials/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau témoignage
        </Button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          {/* Recherche : filtre local sur la liste chargée. */}
          <Card>
            <CardContent className="p-4">
              <SearchInput
                placeholder="Rechercher un témoignage (nom, texte)…"
                value={q}
                onChange={setQ}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {testimonials.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  Aucun témoignage.
                </CardContent>
              </Card>
            )}
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {testimonial.isFeatured && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                              À la une
                            </span>
                          )}
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              testimonial.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {testimonial.isActive ? "visible" : "masqué"}
                          </span>
                          {testimonial.isVerified && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              vérifié
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {testimonial.country ?? ""}
                        {testimonial.country && testimonial.date ? " • " : ""}
                        {testimonial.date ? formatDate(testimonial.date) : ""}
                      </p>
                      <p className="text-gray-700 italic">&quot;{testimonial.text}&quot;</p>
                    </div>
                    <div className="ml-4">
                      <RowActions
                        id={testimonial.id}
                        resource="testimonials"
                        editHref={`/dashboard/testimonials/${testimonial.id}`}
                        enableDelete
                        deleteLabel="Supprimer le témoignage"
                        confirmMessage={`Supprimer le témoignage de « ${testimonial.name} » ?`}
                        onChanged={reload}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
