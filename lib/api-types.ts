/**
 * Enregistrements « API » : la forme JSON exacte produite par l'API PHP
 * (php-api/lib/Model.php + Serial.php) et consommée par le frontend :
 *   - dates     → chaînes ISO 8601 ("2026-10-24T08:56:45.123Z"),
 *   - Decimal   → chaîne ("45000"),
 *   - Json      → déjà décodé (tableaux/objets),
 *   - relations → objets imbriqués (destination, categories, category, author).
 *
 * Ces types structurels remplacent les enregistrements Prisma (Date,
 * Decimal, Decimal[]) pour tout ce qui transite par HTTP.
 */

export interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiDestination {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  country: string | null;
  region: string | null;
  coordinatesLat: string | null;
  coordinatesLng: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCircuit {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  subtitle: string | null;
  subtitleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  destinationId: string | null;
  durationDays: number | null;
  durationNights: number | null;
  price: string;
  currency: string;
  imageUrl: string | null;
  gallery: unknown;
  highlights: unknown;
  highlightsEn: unknown;
  itinerary: unknown;
  itineraryEn: unknown;
  included: unknown;
  includedEn: unknown;
  excluded: unknown;
  excludedEn: unknown;
  difficulty: string | null;
  minParticipants: number | null;
  maxParticipants: number | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  /** Présentes sur les réponses publiques (PublicApi) et le CRUD dashboard. */
  destination?: ApiDestination | null;
  categories?: ApiCategory[];
}

export interface ApiBlogCategory {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface ApiBlogPost {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  content: string | null;
  contentEn: string | null;
  categoryId: string | null;
  authorId: string | null;
  imageUrl: string | null;
  gallery: unknown;
  tags: unknown;
  readTime: number | null;
  views: number;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Présentes sur les réponses publiques (blog + détail). */
  category?: ApiBlogCategory | null;
  author?: ApiUser | null;
}

export interface ApiTestimonial {
  id: string;
  name: string;
  country: string | null;
  rating: number;
  text: string;
  textEn: string | null;
  circuitId: string | null;
  avatarUrl: string | null;
  date: string;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiService {
  id: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  icon: string | null;
  href: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiBooking {
  id: string;
  bookingReference: string;
  type: "circuit" | "stay" | "hotel";
  circuitId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  travelDate: string | null;
  returnDate: string | null;
  participants: number | null;
  totalPrice: string | null;
  currency: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Liste dashboard : {id, title, slug} ou null. */
  circuit?: { id?: string; title?: string; slug?: string } | null;
}

export interface ApiContactRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  requestType: string;
  travelDate: string | null;
  travelers: number | null;
  message: string;
  status: "new" | "in_progress" | "answered" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface ApiSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updatedAt: string;
}

export interface ApiMediaFile {
  id: string;
  filename: string;
  storagePath: string | null;
  url: string;
  mimeType: string | null;
  /** Octets, sérialisés en chaîne (Decimal Prisma → string côté PHP). */
  size: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  altTextEn: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

/** GET /api/auth/me et POST /api/auth/login : {user: {id, email, name, role}}. */
export interface ApiAuthPayload {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "editor" | "viewer";
  };
}
