export interface Circuit {
  id: string;
  slug: string;
  title: string;
  destination: string;
  /** Un circuit peut appartenir à plusieurs catégories (m-n). */
  categories: string[];
  duration: string;
  price: number;
  image: string;
  description: string;
  highlights: string[];
  itinerary: { day: number; title: string; description: string }[];
  included: string[];
  excluded: string[];
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
