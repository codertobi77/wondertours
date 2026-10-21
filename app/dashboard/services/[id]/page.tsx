import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/services/services";
import { ServiceForm } from "@/components/dashboard/forms/service-form";

export const dynamic = "force-dynamic";

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'un service existant : préremplit le formulaire partagé. */
export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

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
