"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { DestinationForm } from "@/components/dashboard/forms/destination-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type { ApiDestination } from "@/lib/api-types";

/** Édition d'une destination existante : préremplit le formulaire partagé. */
export default function EditDestinationPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: destination,
    error,
    loading,
    status,
  } = useApiData<ApiDestination>(`/api/dashboard/destinations/${id}`);

  if (loading) return <LoadingBlock />;
  if (error) {
    if (status === 404) return <MissingBlock label="Destination" />;
    return <ErrorBlock message={error} />;
  }
  if (!destination) return <LoadingBlock />;

  return (
    <DestinationForm
      initial={{
        id: destination.id,
        name: destination.name,
        nameEn: destination.nameEn,
        description: destination.description,
        descriptionEn: destination.descriptionEn,
        country: destination.country,
        region: destination.region,
        imageUrl: destination.imageUrl,
        isActive: destination.isActive,
      }}
    />
  );
}
