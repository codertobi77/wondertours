export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  /** Slug de la catégorie (filtrage ?categorie= côté client). */
  categorySlug?: string;
  excerpt: string;
  content: string;
  image: string;
  /** Image en vedette pour la page de détail (optionnelle, fallback sur image). */
  featuredImage?: string;
  date: string;
  author: string;
  readTime: string;
  // Traductions anglaises optionnelles (repli FR si absentes).
  titleEn?: string;
  categoryEn?: string;
  excerptEn?: string;
  contentEn?: string;
  readTimeEn?: string;
}

export const BLOG_POSTS: BlogPost[] = [];
