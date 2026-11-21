import type { NextConfig } from "next";

// Architecture :
//  - Frontend Next.js → Vercel (wondertoursandservices.com) — SSR/ISR
//  - Backend API PHP  → LWS Perso (api.wondertoursandservices.com)
//  - Base de données  → Aiven (DATABASE_URL)
//
// Sur Vercel (VERCEL=1) : les requêtes /api/* sont proxysées vers l'API PHP.
// Définir PHP_API_ORIGIN dans Vercel pour cibler l'API LWS.
// Le navigateur voit des URLs de même origine — pas de CORS requis, le cookie
// wt_session est partagé.
//
// En développement local : proxy /api/* vers php -S 127.0.0.1:8099
// (router-dev.php).
const nextConfig: NextConfig = {
  // Vercel : réécriture /api/* vers l'API PHP (LWS).
  // PHP_API_ORIGIN permet de pointer vers l'API LWS.
  async rewrites() {
    const origin = (
      process.env.PHP_API_ORIGIN ?? "https://api.wondertoursandservices.com"
    ).replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
