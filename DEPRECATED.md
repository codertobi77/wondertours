# ⚠️ DEPRECATED — Frontend Next.js / Prisma

Le frontend historique basé sur **Next.js + Prisma** est **déprécié**. 
L'application complète a migré vers **Laravel** (`laravel/`) : frontend Blade dynamique + API Laravel (Eloquent) + PostgreSQL (Aiven).

- Nouveau frontend : `laravel/resources/views/` (Blade dynamiques, Tailwind)
- Nouveau backend : `laravel/` (Laravel 11, Eloquent, même contrat `/api/*`)
- Auth JWT conservée (cookie `wt_session`, HS256 avec `AUTH_SECRET`)
- Déploiement : workflows `.github/workflows/deploy-laravel.yml` (ftp lftp + build Vite)
- CI : job `laravel-ci` dans `.github/workflows/ci.yml`

**Ne pas ajouter de nouvelles dépendances sur Next.js/Prisma.** Toute nouvelle fonctionnalité doit être implémentée dans `laravel/`.

Les fichiers à la racine (package.json, prisma/, app/ Next.js) sont conservés temporairement pour référence mais ne sont plus utilisés en production ni en CI.
