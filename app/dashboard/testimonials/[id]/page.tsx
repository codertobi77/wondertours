import { notFound } from "next/navigation";
import { getTestimonialById } from "@/lib/services/testimonials";
import { listCircuits } from "@/lib/services/circuits";
import { TestimonialForm } from "@/components/dashboard/forms/testimonial-form";

export const dynamic = "force-dynamic";

interface EditTestimonialPageProps {
  params: Promise<{ id: string }>;
}

/** Édition d'un témoignage existant : préremplit le formulaire partagé. */
export default async function EditTestimonialPage({
  params,
}: EditTestimonialPageProps) {
  const { id } = await params;
  const testimonial = await getTestimonialById(id);
  if (!testimonial) notFound();

  const circuits = await listCircuits({ pageSize: 100 });

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
        date: testimonial.date ? testimonial.date.toISOString() : null,
        isVerified: testimonial.isVerified,
        isFeatured: testimonial.isFeatured,
        isActive: testimonial.isActive,
      }}
    />
  );
}
