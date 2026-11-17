export interface Testimonial {
  id: string;
  name: string;
  country: string;
  rating: number;
  text: string;
  /** Version anglaise (traduction DeepL à la publication) ; null si absente. */
  textEn?: string | null;
  avatar?: string;
  date: string;
}

export const TESTIMONIALS: Testimonial[] = [];
