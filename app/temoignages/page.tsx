import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { LocalizedHero } from "@/components/common/localized-hero";
import { TestimonialsPageContent } from "@/components/testimonials/testimonials-page-content";
import { getTestimonials } from "@/lib/content";
import { generateMetadata } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "Témoignages - Wonder Tours and Services",
  description: "Découvrez les témoignages de nos voyageurs au Bénin, au Togo et au Ghana. Des expériences authentiques et inoubliables avec Wonder Tours and Services.",
  path: "/temoignages"
});

// Page statique : tous les témoignages actifs sont embarqués au build, la
// pagination ?page= est gérée côté client dans TestimonialsPageContent
// (useSearchParams exige le <Suspense> ci-dessous).
export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  const averageRating =
    testimonials.length > 0
      ? testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length
      : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <LocalizedHero
          subtitle="TÉMOIGNAGES"
          titleFr="Des voyages qui laissent des souvenirs"
          titleEn="Trips that leave memories"
          descriptionFr="Découvrez les expériences de nos voyageurs et laissez-vous inspirer pour votre prochaine aventure au Bénin, au Togo ou au Ghana."
          descriptionEn="Discover our travelers' experiences and get inspired for your next adventure in Benin, Togo or Ghana."
          ctaFr="Partager mon expérience"
          ctaEn="Share my experience"
          ctaHref="/contact"
          image="/photos_site wonder_tours/IMG-20260805-WA0055.jpg"
        />

        {/* Corps bilingue (stats, grille, CTA) */}
        <Suspense fallback={null}>
          <TestimonialsPageContent
            testimonials={testimonials}
            averageRating={averageRating}
          />
        </Suspense>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
