<?php

declare(strict_types=1);

/**
 * Modèle de configuration de l'API PHP — copier vers `config.local.php`
 * (jamais commité, cf. .gitignore) et renseigner les valeurs.
 *
 * Chaque clé peut aussi être fournie par variable d'environnement du même
 * nom en MAJUSCULES (DATABASE_URL, AUTH_SECRET…) — utile en CI ou si
 * config.local.php n'est pas déployable. Ordre de résolution :
 * config.local.php → getenv → valeurs par défaut intégrées (Env.php).
 */

return [
    // PostgreSQL (URI Aiven, sslmode=require conservé) — OBLIGATOIRE.
    'database_url' => 'postgresql://user:password@host:port/dbname?sslmode=require',

    // Secret JWT HS256 — OBLIGATOIRE, identique au AUTH_SECRET du Next.js
    // pour que les sessions restent compatibles entre les deux stacks.
    'auth_secret' => 'remplacer-par-le-meme-secret-que-AUTH_SECRET',

    // URL publique du site (liens dans les e-mails, sitemap…).
    'app_url' => 'https://wondertoursandservices.com',

    // Expéditeur Resend et adresse de réception des notifications équipe.
    'mail_from' => 'Wonder Tours <onboarding@resend.dev>',
    'mail_team_email' => 'contact@wondertoursandservices.com',
    'resend_api_key' => '', // vide : e-mails ignorés silencieusement (best-effort)

    // Médias : imgBB (recommandé) sinon dépôt local dans uploads_dir.
    'imgbb_api_key' => '',

    // DeepL : sans clé, POST /api/translate répond 503 explicite.
    'deepl_api_key' => '',

    // Répertoire de dépôt local des médias (chemin absolu conseillé en prod).
    // Par défaut : dossier `uploads/` voisin de php-api à la racine du site.
    'uploads_dir' => '',

    // true : cookies Secure (obligatoire derrière HTTPS ; défaut = app_url en https).
    'secure_cookies' => '',

    // GitHub : token PAT (scope repo) pour déclencher le rebuild du site
    // (repository_dispatch « content-updated ») depuis le dashboard.
    // Local : variable d'environnement GITHUB_TOKEN dans .env.
    // CI : secret GitHub nommé GH_PAT (le préfixe GITHUB_ est réservé).
    // Sans token : la publication manuelle est désactivée (best-effort).
    'github_token' => '',
    'github_repo' => 'codertobi77/wondertours',

    // Fuseau horaire PHP (les dates SQL sont toujours lues en UTC).
    'timezone' => 'UTC',

    // Fichier de log des erreurs applicatives (chemin absolu, vide = désactivé).
    'debug_log' => '',
];
