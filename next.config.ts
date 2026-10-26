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
    };

export default nextConfig;
