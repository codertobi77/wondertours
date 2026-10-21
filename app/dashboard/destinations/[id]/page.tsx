import { notFound } from "next/navigation";
import { getDestinationById } from "@/lib/services/destinations";
import { DestinationForm } from "@/components/dashboard/forms/destination-form";

export const dynamic = "force-dynamic";

interface EditDestinationPageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'une destination existante : préremplit le formulaire partagé. */
export default async function EditDestinationPage({
  params,
}: EditDestinationPageProps) {
  const { id } = await params;
  const destination = await getDestinationById(id);
  if (!destination) notFound();

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
