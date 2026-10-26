"use client";

import { useApiData } from "@/lib/api-client";
import { CircuitForm } from "@/components/dashboard/forms/circuit-form";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import type { ApiCategory, ApiDestination, ApiPage } from "@/lib/api-types";

export default function NewCircuitPage() {
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

  if (destinationsLoading || categoriesLoading) return <LoadingBlock />;
  if (destinationsError) return <ErrorBlock message={destinationsError} />;
  if (categoriesError) return <ErrorBlock message={categoriesError} />;
  if (!destinations || !categories) return <LoadingBlock />;

  return (
    <CircuitForm
      destinations={destinations.items.map((d) => ({
        value: d.id,
        label: `${d.name}${d.country ? ` (${d.country})` : ""}`,
      }))}
      categories={categories.items.map((c) => ({ value: c.id, label: c.name }))}
    />
  );
}
