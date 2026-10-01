import type { NextConfig } from "next";

// Sur Vercel, `output: "standalone"` casse le build : ce mode ne génère pas
// .next/next-server.js.nft.json, exigé par le hook onBuildComplete de la
// plateforme (ENOENT → déploiement en erreur). VERCEL=1 pendant les builds
// Vercel → sortie par défaut. Partout ailleurs (CI, scripts/package-lws.sh),
// bundle autonome .next/standalone/server.js pour le déploiement LWS (cPanel).
const nextConfig: NextConfig = process.env.VERCEL
  ? {}
  : { output: "standalone" };

export default nextConfig;
