/**
 * Couche de contenu des pages publiques — exécutée AU RUNTIME (Server
 * Components avec `noStore` pour le SSR dynamique) contre l'API PHP déployée.
 *
 * Source de vérité : `${APP_URL}/api/...` (l'API est déployée sur LWS).
 * Repli : les constantes `lib/data/*` si l'API est indisponible — la page
 * affiche alors des données vides mais valides.
 *
 * Mémoïsation par requête (Map module) : plusieurs composants sur une même
 * route ne refont pas le même appel HTTP.
 * (Cache serveur supprimé : toutes les requêtes sont dynamiques)
 * la charge sur l'API PHP.
 */
"use server";

import { SITE_CONFIG, SERVICES, DESTINATIONS } from "@/lib/constants";
import { BLOG_POSTS } from "@/lib/data/blog";
import { CIRCUITS } from "@/lib/data/circuits";
import { TESTIMONIALS } from "@/lib/data/testimonials";
import { toBlogPostVM, toCircuitVM, toTestimonialVM } from "@/lib/view-models";
import type {
  ApiBlogCategory,
  ApiBlogPost,
  ApiCategory,
  ApiCircuit,
  ApiDestination,
  ApiPage,
  ApiService,
  ApiSetting,
  ApiTestimonial,
} from "@/lib/api-types";
import type { BlogPost as StaticBlogPost } from "@/lib/data/blog";
import type { Circuit as StaticCircuit } from "@/lib/data/circuits";
import type { Testimonial as StaticTestimonial } from "@/lib/data/testimonials";

/**
 * Base de l'API : APP_URL (env de build/déployement). APP_URL="" désactive
 * explicitement le fetch → repli immédiat. Défaut : l'URL publique
 * du site (l'API est same-origin en production).
 */
function apiBase(): string | null {
  const url = process.env.APP_URL;
  if (url !== undefined) {
    return url.trim() === "" ? null : url.trim().replace(/\/+$/, "");
  }
  return SITE_CONFIG.url.replace(/\/+$/, "");
}

/** Fetch JSON best-effort : null sur tout échec (réseau, statut, timeout). */
async function fetchApi<T>(path: string): Promise<T | null> {
  const base = apiBase();
  if (base === null) {
    return null;
  }
  // Plusieurs tentatives : l'API LWS peut être lente au premier appel
  // (cold start). La page ne doit jamais échouer sur le contenu.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${base}${path}`, {
        // no-store = SSR dynamique (pas de cache)
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      // on réessaie
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return null; // repli lib/data — la page continue
}

// ─────────────────────────────── Mémoïsation par requête ───────────────────────────────

const memo = new Map<string, Promise<unknown>>();

/** Déduplique les appels identiques pendant la requête (clé = chemin API). */
function memoized<T>(path: string): Promise<T | null> {
  if (!memo.has(path)) {
    memo.set(path, fetchApi<T>(path));
  }
  return memo.get(path) as Promise<T | null>;
}

// ─────────────────────────────── Circuits ───────────────────────────────

/** Tous les circuits actifs (ordre : isFeatured desc, createdAt desc). */
export async function getCircuits(): Promise<StaticCircuit[]> {
  const items = await fetchPage<ApiCircuit>("/api/circuits");
  return items.length > 0 ? items.map(toCircuitVM) : CIRCUITS;
}

/** Slugs des circuits actifs — generateStaticParams pour /circuits/[slug]. */
export async function getCircuitSlugs(): Promise<string[]> {
  const circuits = await getCircuits();
  return circuits.map((circuit) => circuit.slug);
}

/** Circuit actif par slug (null → notFound / repli absent). */
export async function getCircuit(slug: string): Promise<StaticCircuit | null> {
  const circuit = await memoized<ApiCircuit>(`/api/circuits/${slug}`);
  return circuit ? toCircuitVM(circuit) : null;
}

// ─────────────────────────────── Blog ───────────────────────────────

/** Tous les articles publiés (ordre : isFeatured desc, publishedAt desc). */
export async function getBlogPosts(): Promise<StaticBlogPost[]> {
  const items = await fetchPage<ApiBlogPost>("/api/blog");
  return items.length > 0 ? items.map(toBlogPostVM) : BLOG_POSTS;
}

/** Slugs des articles publiés — generateStaticParams de /blog/[slug]. */
export async function getBlogSlugs(): Promise<string[]> {
  const posts = await getBlogPosts();
  return posts.map((post) => post.slug);
}

/** Article publié par slug (null → notFound / repli absent). */
export async function getBlogPost(slug: string): Promise<StaticBlogPost | null> {
  const post = await memoized<ApiBlogPost>(`/api/blog/${slug}`);
  return post ? toBlogPostVM(post) : null;
}

/** Catégories de blog actives (tri sortOrder puis nom). */
export async function getBlogCategories(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const items = await fetchPage<ApiBlogCategory>("/api/blog-categories");
  return items.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));
}

// ─────────────────────────────── Listes simples ───────────────────────────────

function listPath(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}pageSize=100`;
}

async function fetchPage<T>(path: string): Promise<T[]> {
  const page = await memoized<ApiPage<T>>(listPath(path));
  return page?.items ?? [];
}

export async function getDestinations(): Promise<ApiDestination[]> {
  const items = await fetchPage<ApiDestination>("/api/destinations");
  if (items.length > 0) return items;
  // Repli statique (constants) si l'API est indisponible.
  return DESTINATIONS.map((name, i) => ({
    id: String(i),
    name,
    nameEn: name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    description: null,
    descriptionEn: null,
    imageUrl: null,
    country: null,
    region: null,
    coordinatesLat: null,
    coordinatesLng: null,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  }));
}

export async function getCategories(): Promise<ApiCategory[]> {
  return fetchPage<ApiCategory>("/api/categories");
}

export async function getTestimonials(): Promise<StaticTestimonial[]> {
  const items = await fetchPage<ApiTestimonial>("/api/testimonials");
  return items.length > 0 ? items.map(toTestimonialVM) : TESTIMONIALS;
}

export interface ServiceVM {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
  href: string;
}

export async function getServices(): Promise<ServiceVM[]> {
  const items = await fetchPage<ApiService>("/api/services");
  if (items.length > 0) {
    return items.map((service) => ({
      id: service.id,
      title: service.title,
      titleEn: service.titleEn ?? undefined,
      description: service.description ?? "",
      descriptionEn: service.descriptionEn ?? undefined,
      icon: service.icon ?? "Map",
      href: service.href ?? "/contact",
    }));
  }
  // Repli statique (constants) si l'API est indisponible.
  return SERVICES.map((service) => ({
    id: String(service.id),
    title: service.title,
    titleEn: service.titleEn,
    description: service.description,
    descriptionEn: service.descriptionEn,
    icon: service.icon,
    href: service.href,
  }));
}

// ─────────────────────────────── Paramètres publics ───────────────────────────────

/**
 * Paramètres publics (liste blanche côté API : biographies du fondateur).
 * Retourne une map key → value, ou {} si indisponible.
 */
export async function getPublicSettings(): Promise<Record<string, string>> {
  const page = await fetchPage<ApiSetting>("/api/settings");
  const entries = page
    .filter((setting) => setting.value !== null)
    .map((setting) => [setting.key, setting.value as string]);
  return Object.fromEntries(entries);
}

// ─────────────────────────────── Footer / Navigation ───────────────────────────────

export interface FooterData {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  whatsappNumber: string;
  founderBioFr: string;
  founderBioEn: string;
  founderName: string;
  founderTitle: string;
  mapEmbedUrl: string;
}

/** Données complètes pour le footer (dynamique). */
export async function getFooterData(): Promise<FooterData> {
  const settings = await getPublicSettings();
  return {
    siteName: settings.site_name ?? SITE_CONFIG.name,
    siteDescription: settings.site_description ?? SITE_CONFIG.description,
    contactEmail: settings.contact_email ?? SITE_CONFIG.contact.email,
    contactPhone: settings.contact_phone ?? SITE_CONFIG.contact.phone,
    contactAddress: settings.contact_address ?? SITE_CONFIG.contact.address,
    socialFacebook: settings.social_facebook ?? SITE_CONFIG.links.facebook,
    socialInstagram: settings.social_instagram ?? SITE_CONFIG.links.instagram,
    socialYoutube: settings.social_youtube ?? SITE_CONFIG.links.youtube,
    whatsappNumber: settings.whatsapp_number ?? SITE_CONFIG.links.whatsapp,
    founderBioFr: settings.founder_bio_fr ?? "",
    founderBioEn: settings.founder_bio_en ?? "",
    founderName: SITE_CONFIG.founder.name,
    founderTitle: SITE_CONFIG.founder.title,
    mapEmbedUrl: SITE_CONFIG.map.embedUrl,
  };
}