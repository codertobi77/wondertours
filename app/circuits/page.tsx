import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { LocalizedHero } from "@/components/common/localized-hero";
import { CircuitsCtaSection } from "@/components/circuits/circuits-cta-section";
import { CircuitsExplorer } from "@/components/circuits/circuits-explorer";
import { getCategories, getCircuits, getDestinations } from "@/lib/content";
import { generateMetadata } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "Circuits touristiques au Bénin, Togo et Ghana - Wonder Tours and Services",
  description: "Explorez nos circuits touristiques au Bénin, au Togo et au Ghana : Ouidah, Abomey, Lomé, Kumasi, Ganvié, Grand-Popo. Circuits culturels, historiques et nature.",
  path: "/circuits"
});

// Page statique : tous les circuits actifs sont embarqués au build, le
// filtrage (?category=, ?page=) et la pagination se font côté client dans
// CircuitsExplorer (useSearchParams exige le <Suspense> ci-dessous).
export default async function CircuitsPage() {
  const [circuits, destinations, categories] = await Promise.all([
    getCircuits(),
    getDestinations(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <LocalizedHero
          subtitle="NOS CIRCUITS"
          titleFr="Explorez nos circuits touristiques"
          titleEn="Explore our tourist circuits"
          descriptionFr="Découvrez le Bénin, le Togo et le Ghana à travers nos circuits soigneusement conçus pour vous offrir des expériences authentiques et inoubliables."
          descriptionEn="Discover Benin, Togo and Ghana through our carefully designed circuits to offer you authentic and unforgettable experiences."
          ctaFr="Demander un devis"
          ctaEn="Request a quote"
          ctaHref="/contact"
          image="/photos_site wonder_tours/IMG_20240112_112544_4.jpg"
        />

        {/* Filtres + grille (composant client, état initial depuis l'URL) */}
        <Suspense fallback={null}>
          <CircuitsExplorer
            circuits={circuits}
            categories={categories.map((category) => ({
              name: category.name,
              slug: category.slug,
            }))}
            destinations={destinations.map((destination) => ({
              name: destination.name,
              slug: destination.slug,
            }))}
          />
        </Suspense>

        {/* CTA Section */}
        <CircuitsCtaSection />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
