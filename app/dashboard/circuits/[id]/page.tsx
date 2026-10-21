import { notFound } from "next/navigation";
import { getCircuitById } from "@/lib/services/circuits";
import { listDestinations } from "@/lib/services/destinations";
import { listCategories } from "@/lib/services/categories";
import { toStringArray, toItinerary } from "@/lib/view-models";
import { CircuitForm } from "@/components/dashboard/forms/circuit-form";

export const dynamic = "force-dynamic";

interface EditCircuitPageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'un circuit existant : préremplit le formulaire partagé. */
export default async function EditCircuitPage({ params }: EditCircuitPageProps) {
  const { id } = await params;
  const circuit = await getCircuitById(id);
  if (!circuit) notFound();

  const [destinations, categories] = await Promise.all([
    listDestinations({ pageSize: 100 }),
    listCategories({ pageSize: 100 }),
  ]);

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
        categoryIds: circuit.categories.map((category) => category.id),
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
