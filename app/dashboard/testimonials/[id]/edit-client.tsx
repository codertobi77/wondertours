"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { TestimonialForm } from "@/components/dashboard/forms/testimonial-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type { ApiCircuit, ApiPage, ApiTestimonial } from "@/lib/api-types";

/** Édition d'un témoignage existant : préremplit le formulaire partagé. */
export default function EditTestimonialPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: testimonial,
    error: testimonialError,
    loading: testimonialLoading,
    status: testimonialStatus,
  } = useApiData<ApiTestimonial>(`/api/dashboard/testimonials/${id}`);
  const {
    data: circuits,
    error: circuitsError,
    loading: circuitsLoading,
  } = useApiData<ApiPage<ApiCircuit>>("/api/dashboard/circuits?pageSize=100");

  if (testimonialLoading || circuitsLoading) return <LoadingBlock />;
  if (testimonialError) {
    if (testimonialStatus === 404) return <MissingBlock label="Témoignage" />;
    return <ErrorBlock message={testimonialError} />;
  }
  if (circuitsError) return <ErrorBlock message={circuitsError} />;
  if (!testimonial || !circuits) return <LoadingBlock />;

  return (
    <TestimonialForm
      circuits={circuits.items.map((c) => ({ value: c.id, label: c.title }))}
      initial={{
        id: testimonial.id,
        name: testimonial.name,
        country: testimonial.country,
        rating: testimonial.rating,
        text: testimonial.text,
        textEn: testimonial.textEn,
        circuitId: testimonial.circuitId,
        avatarUrl: testimonial.avatarUrl,
        // L'API sérialise déjà la date en ISO ("2026-12-15T00:00:00.000Z"),
        // directement compatible avec input[type=date].
        date: testimonial.date,
        isVerified: testimonial.isVerified,
        isFeatured: testimonial.isFeatured,
        isActive: testimonial.isActive,
      }}
    />
  );
}
