export interface Circuit {
  id: string;
  slug: string;
  title: string;
  destination: string;
  /** Un circuit peut appartenir à plusieurs catégories (m-n). */
  categories: string[];
  duration: string;
  price: number;
  currency: string;
  image: string;
  description: string;
  highlights: string[];
  itinerary: { day: number; title: string; description: string }[];
  included: string[];
  excluded: string[];
  /** Galerie d'images (optionnelle, pour la page de détail). */
  gallery?: string[];
  // Traductions anglaises optionnelles (repli FR si absentes).
  titleEn?: string;
  destinationEn?: string;
  categoriesEn?: string[];
  durationEn?: string;
  descriptionEn?: string;
  highlightsEn?: string[];
  itineraryEn?: { day: number; title: string; description: string }[];
  includedEn?: string[];
  excludedEn?: string[];
}

export const CIRCUITS: Circuit[] = [];
