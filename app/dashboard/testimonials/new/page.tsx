"use client";

import { useApiData } from "@/lib/api-client";
import { TestimonialForm } from "@/components/dashboard/forms/testimonial-form";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import type { ApiCircuit, ApiPage } from "@/lib/api-types";

export default function NewTestimonialPage() {
  const {
    data: circuits,
    error,
    loading,
  } = useApiData<ApiPage<ApiCircuit>>("/api/dashboard/circuits?pageSize=100");

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!circuits) return <LoadingBlock />;

  return (
    <TestimonialForm
      circuits={circuits.items.map((c) => ({ value: c.id, label: c.title }))}
    />
  );
}
