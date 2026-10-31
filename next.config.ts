import type { NextConfig } from "next";

// Architecture cible :
//  - Frontend Next.js → Vercel (wondertoursandservices.com)
//  - Backend API PHP  → LWS Perso (api.wondertoursandservices.com)
//  - Base de données  → Aiven (DATABASE_URL)
//
// Sur Vercel (VERCEL=1) : les requêtes /api/* sont proxysées vers l'API PHP
// sur LWS (https://api.wondertoursandservices.com). Le navigateur voit des
// URLs de même origine (wondertoursandservices.com) — pas de CORS requis,
// le cookie wt_session est partagé.
//
// En développement local : proxy /api/* vers php -S 127.0.0.1:8099
// (router-dev.php).
//
// Partout ailleurs (export statique pour LWS) : output: "export", les pages
// sont servies par Apache et /api/* est servi par php-api/ via .htaccess
// (même origine).
const nextConfig: NextConfig = process.env.VERCEL
  ? {
      // Vercel : réécriture /api/* vers l'API PHP sur LWS (sous-domaine).
      async rewrites() {
        return [
          {
            source: "/api/:path*",
            destination: "https://api.wondertoursandservices.com/api/:path*",
          },
        ];
      },
    }
  : {
      output: "export",
      images: { unoptimized: true },
      // Dev uniquement (next dev) : proxy /api/* vers l'API PHP locale.
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