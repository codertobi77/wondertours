import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { getBlogSlugs, getCircuitSlugs } from "@/lib/content";

// `output: export` : les routes de métadonnées doivent être statiques.
export const dynamic = "force-static";

// Sitemap généré au build : pages statiques + une URL par circuit et par
// article publié (slugs récupérés de l'API déployée, cf. lib/content).
// Si l'API est indisponible au build, le sitemap ne contient que les pages
// statiques — le build ne doit pas échouer sur le contenu.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;

  // Pages statiques principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/circuits`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sejours`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hotels`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/temoignages`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/a-propos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Pages de détail (circuits + articles) — best effort
  const [circuitSlugs, blogSlugs] = await Promise.all([
    getCircuitSlugs().catch(() => [] as string[]),
    getBlogSlugs().catch(() => [] as string[]),
  ]);

  const circuitPages: MetadataRoute.Sitemap = circuitSlugs.map((slug) => ({
    url: `${baseUrl}/circuits/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...circuitPages, ...blogPages];
}
