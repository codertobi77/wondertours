import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/constants";

// `output: export` : les routes de métadonnées doivent être statiques.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/", "/admin/"],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
