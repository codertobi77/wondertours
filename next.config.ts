import type { NextConfig } from "next";

// Deux modes de build :
//  - Vercel (VERCEL=1 pendant leurs builds) : sortie serveur par défaut —
//    déploiement historique de la plateforme.
//  - Partout ailleurs (CI, LWS) : `output: "export"` → dossier statique
//    `out/` servi par Apache (le mutualisé LWS n'expose pas Node.js).
//    L'API same-origin /api/* est servie par php-api/ (cf. docs/deployment-lws.md).
// `images.unoptimized` : l'optimiseur par défaut exige un serveur Node —
// indisponible en statique, les images sont servies telles quelles.
const nextConfig: NextConfig = process.env.VERCEL
  ? {}
  : {
      output: "export",
      images: { unoptimized: true },
      // Dev uniquement (next dev) : proxy /api/* vers l'API PHP locale
      // (php -S 127.0.0.1:8099 router-dev.php, cf. php-api/). Le tableau
      // est vide en build (NODE_ENV=production) — l'export statique
      // refuse les rewrites ; en production Apache route /api/* via
      // public_html/api/.htaccess.
      ...(process.env.NODE_ENV === "development"
        ? {
            async rewrites() {
              const target = (
                process.env.DEV_API_URL ?? "http://127.0.0.1:8099"
              ).replace(/\/+$/, "");
              return [
                {
                  source: "/api/:path*",
                  destination: `${target}/api/:path*`,
                },
              ];
            },
          }
        : {}),
    };

export default nextConfig;
