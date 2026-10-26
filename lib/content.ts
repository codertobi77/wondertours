/**
 * Couche de contenu des pages publiques — exécutée AU BUILD (Server
 * Components de l'export statique) contre l'API PHP déployée.
 *
 * Source de vérité : `${APP_URL}/api/...` (l'API est déployée AVANT le
 * build du frontend — cf. docs/deployment-lws.md, ordre API → frontend).
 * Repli : les constantes `lib/data/*` si l'API est indisponible au build
 * (CI sans APP_URL, coupure réseau…) — le build ne doit jamais échouer
 * sur le contenu, il produit alors des pages vides mais valides.
 *
 * Mémoïsation par build (Map module) : generateMetadata + page + sidebar
 * d'une même route ne refont pas le même appel HTTP (utile contre une
 * base Aiven distante), et /api/blog/{slug} n'incrémente les vues qu'une
 * fois par build.
 */
import { SITE_CONFIG } from "@/lib/constants";
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
 * explicitement le fetch (CI) → repli immédiat. Défaut : l'URL publique
 * du site (l'API est same-origin en production).
 */
export function apiBase(): string | null {
  const url = process.env.APP_URL;
  if (url !== undefined) {
    return url.trim() === "" ? null : url.trim().replace(/\/+$/, "");
  }
  return SITE_CONFIG.url.replace(/\/+$/, "");
}

/** Fetch JSON best-effort : null sur tout échec (réseau, statut, timeout 8 s). */
async function fetchApi<T>(path: string): Promise<T | null> {
  const base = apiBase();
  if (base === null) {
    return null;
  }
  try {
    const response = await fetch(`${base}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null; // repli lib/data — le build continue
  }
}

// ─────────────────────────────── Mémoïsation ───────────────────────────────

const memo = new Map<string, Promise<unknown>>();

/** Déduplique les appels identiques pendant le build (clé = chemin API). */
function memoized<T>(path: string): Promise<T | null> {
  if (!memo.has(path)) {
    memo.set(path, fetchApi<T>(path));
  }
  return memo.get(path) as Promise<T | null>;
}

// ─────────────────────────────── Lecteurs bruts ───────────────────────────────

function listPath(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}pageSize=100`;
}

async function fetchPage<T>(path: string): Promise<T[]> {
  const page = await memoized<ApiPage<T>>(listPath(path));
  return page?.items ?? [];
}

// ─────────────────────────────── Circuits ───────────────────────────────

/** Tous les circuits actifs (ordre : isFeatured desc, createdAt desc). */
export async function getCircuits(): Promise<StaticCircuit[]> {
  const items = await fetchPage<ApiCircuit>("/api/circuits");
  return items.length > 0 ? items.map(toCircuitVM) : CIRCUITS;
}

/** Slugs des circuits actifs — generateStaticParams de /circuits/[slug]. */
export async function getCircuitSlugs(): Promise<string[]> {
  return (await getCircuits()).map((circuit) => circuit.slug);
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
  return (await getBlogPosts()).map((post) => post.slug);
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

export async function getDestinations(): Promise<ApiDestination[]> {
  return fetchPage<ApiDestination>("/api/destinations");
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

// ─────────────────────────────── Paramètres publics ───────────────────────────────

/**
 * Paramètres publics (liste blanche côté API : biographies du fondateur).
 * Retourne une map key → value, ou {} si indisponible au build.
 */
export async function getPublicSettings(): Promise<Record<string, string>> {
  const page = await memoized<ApiPage<ApiSetting>>("/api/settings");
  const entries = (page?.items ?? [])
    .filter((setting) => setting.value !== null)
    .map((setting) => [setting.key, setting.value as string]);
  return Object.fromEntries(entries);
}
