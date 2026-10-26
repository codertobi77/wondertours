"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { toStringArray, toItinerary } from "@/lib/view-models";
import { CircuitForm } from "@/components/dashboard/forms/circuit-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type {
  ApiCategory,
  ApiCircuit,
  ApiDestination,
  ApiPage,
} from "@/lib/api-types";

/** Édition d'un circuit existant : préremplit le formulaire partagé. */
export default function EditCircuitPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: circuit,
    error: circuitError,
    loading: circuitLoading,
    status: circuitStatus,
  } = useApiData<ApiCircuit>(`/api/dashboard/circuits/${id}`);
  const {
    data: destinations,
    error: destinationsError,
    loading: destinationsLoading,
  } = useApiData<ApiPage<ApiDestination>>(
    "/api/dashboard/destinations?pageSize=100"
  );
  const {
    data: categories,
    error: categoriesError,
    loading: categoriesLoading,
  } = useApiData<ApiPage<ApiCategory>>("/api/dashboard/categories?pageSize=100");

  if (circuitLoading || destinationsLoading || categoriesLoading) {
    return <LoadingBlock />;
  }
  if (circuitError) {
    if (circuitStatus === 404) return <MissingBlock label="Circuit" />;
    return <ErrorBlock message={circuitError} />;
  }
  if (destinationsError) return <ErrorBlock message={destinationsError} />;
  if (categoriesError) return <ErrorBlock message={categoriesError} />;
  if (!circuit || !destinations || !categories) {
    return <LoadingBlock />;
  }

  return (
    <CircuitForm
      destinations={destinations.items.map((d) => ({
        value: d.id,
        label: `${d.name}${d.country ? ` (${d.country})` : ""}`,
      }))}
      categories={categories.items.map((c) => ({ value: c.id, label: c.name }))}
      initial={{
        id: circuit.id,
        title: circuit.title,
        titleEn: circuit.titleEn,
        subtitle: circuit.subtitle,
        subtitleEn: circuit.subtitleEn,
        description: circuit.description,
        descriptionEn: circuit.descriptionEn,
        destinationId: circuit.destinationId,
        categoryIds: (circuit.categories ?? []).map((category) => category.id),
        durationDays: circuit.durationDays,
        durationNights: circuit.durationNights,
        price: Number(circuit.price),
        difficulty: circuit.difficulty,
        minParticipants: circuit.minParticipants,
        maxParticipants: circuit.maxParticipants,
        imageUrl: circuit.imageUrl,
        highlights: toStringArray(circuit.highlights),
        highlightsEn: toStringArray(circuit.highlightsEn),
        itinerary: toItinerary(circuit.itinerary),
        itineraryEn: toItinerary(circuit.itineraryEn),
        included: toStringArray(circuit.included),
        includedEn: toStringArray(circuit.includedEn),
        excluded: toStringArray(circuit.excluded),
        excludedEn: toStringArray(circuit.excludedEn),
        isFeatured: circuit.isFeatured,
        isActive: circuit.isActive,
      }}
    />
  );
}
