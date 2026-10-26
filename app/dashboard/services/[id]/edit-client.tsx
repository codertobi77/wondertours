"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api-client";
import { ServiceForm } from "@/components/dashboard/forms/service-form";
import { ErrorBlock, LoadingBlock, MissingBlock } from "@/components/dashboard/api-state";
import type { ApiService } from "@/lib/api-types";

/** Édition d'un service existant : préremplit le formulaire partagé. */
export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: service,
    error,
    loading,
    status,
  } = useApiData<ApiService>(`/api/dashboard/services/${id}`);

  if (loading) return <LoadingBlock />;
  if (error) {
    if (status === 404) return <MissingBlock label="Service" />;
    return <ErrorBlock message={error} />;
  }
  if (!service) return <LoadingBlock />;

  return (
    <ServiceForm
      initial={{
        id: service.id,
        title: service.title,
        titleEn: service.titleEn,
        description: service.description,
        descriptionEn: service.descriptionEn,
        icon: service.icon,
        href: service.href,
        sortOrder: service.sortOrder,
        isActive: service.isActive,
      }}
    />
  );
}
