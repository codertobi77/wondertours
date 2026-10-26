import { HomeContent } from "@/components/home/home-content";
import {
  getCircuits,
  getDestinations,
  getServices,
  getTestimonials,
  getBlogPosts,
} from "@/lib/content";
import { generateMetadata } from "@/lib/seo";

// Contenu embarqué AU BUILD depuis l'API PHP déployée (lib/content) —
// export statique : la page n'est plus rendue à la requête. Un changement
// de contenu dashboard passe par un nouveau build/déploiement.
export const metadata = generateMetadata({
  title: "Wonder Tours and Services - Tourisme au Bénin, Togo et Ghana",
  description: "Découvrez le Bénin, le Togo et le Ghana avec Wonder Tours and Services. Plus de 20 ans d'expertise en circuits touristiques, excursions et séjours authentiques.",
  path: "/"
});

export default async function Home() {
  const [circuits, testimonials, posts, services, destinations] =
    await Promise.all([
      getCircuits(),
      getTestimonials(),
      getBlogPosts(),
      getServices(),
      getDestinations(),
    ]);

  // Les view-models (strings, numbers) sont sérialisables : ils peuvent
  // traverser la frontière serveur → client (HomeContent est client car
  // la locale vit dans un contexte React client).
  return (
    <HomeContent
      circuits={circuits.slice(0, 6)}
      testimonials={testimonials}
      posts={posts.slice(0, 3)}
      services={services.map((service) => ({
        id: service.id,
        title: service.title,
        description: service.description,
        icon: service.icon,
        href: service.href,
      }))}
      destinations={destinations.map((destination) => ({
        id: destination.id,
        name: destination.name,
      }))}
    />
  );
}
