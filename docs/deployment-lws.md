# Déploiement LWS (hébergement mutualisé cPanel / Passenger)

Procédure de déploiement du site Wonder Tours sur un hébergement **LWS cPanel mutualisé**, où Node.js s'exécute via **Phusion Passenger** (Apache).

**Stratégie** : le mutualisé interdit PM2/ports dédiés et un `npm install` serveur risque d'être tué par les limites CPU/RAM. On construit donc **localement (ou en CI) un bundle autonome** `output: "standalone"` — `node_modules` minimal, client Prisma compilé, assets inclus — qu'on uploaye et extrait tel quel. **Aucun build ni installation sur le serveur.**

L'existant Vercel + Aiven continue de fonctionner en parallèle : le premier déploiement LWS pointe sur la base **Aiven** (zéro migration), la bascule vers le PostgreSQL local LWS est documentée en §9.

## Vue d'ensemble du fonctionnement

- `next.config.ts` active `output: "standalone"` → `next build` produit `.next/standalone/` avec un `server.js` minimal.
- `server.js` écoute sur `process.env.PORT` (fourni par Passenger) et lie `process.env.HOSTNAME` (défaut `0.0.0.0`).
- Passenger démarre le processus au premier hit et le garde en vie ; le redémarrage se fait depuis cPanel (« Setup Node.js App » → *Restart*).
- Le bundle **ne contient aucun `.env`** (purge au packaging, cf. `scripts/package-lws.sh`) : les secrets vivent dans les variables d'environnement cPanel.
- Le client Prisma est **compilé dans les chunks serveur** (`.next/server/chunks`, WASM inclus) — vérifié par le smoke test du script de packaging.

## 1. Construire le bundle

**Localement** (valide l'exact bundle avant upload — `--smoke` démarre `server.js` en local et vérifie `/a-propos` + `/api/circuits`) :

```bash
bash scripts/package-lws.sh --smoke
```

Résultat : `dist-lws/wondertours-standalone-<rev>-<date>.tar.gz` (~83 Mo, images de `public/` incluses ; `dist-lws/` est gitignoré).

**Ou via GitHub Actions** (recommandé — §8) : l'artefact `wondertours-lws-bundle` de la run « Package LWS », ou la pièce jointe d'une Release tag `lws-v*`.

## 2. Créer l'application Node.js dans cPanel

cPanel → **Setup Node.js App** → *Create Application* :

| Champ | Valeur |
|-------|-------|
| Node.js version | **22.x (LTS)** — Next 16 requiert Node ≥ 20.9 |
| Application mode | **Production** |
| Application root | `wondertours` (créé hors `public_html`, ex. `~/wondertours`) |
| Application URL | le domaine/sous-domaine à servir (doit exister au préalable) |
| Application startup file | `server.js` |

**Ne pas cliquer sur « Run NPM Install »** : le bundle est autonome, l'installation serveur est inutile et risquée.

## 3. Déposer et extraire le bundle

1. Uploader le `.tar.gz` dans `~/wondertours` (FTP ou gestionnaire de fichiers cPanel).
2. Extraire :
   - Terminal cPanel : `tar -xzf wondertours-standalone-*.tar.gz -C ~/wondertours`
   - ou gestionnaire de fichiers : clic droit → *Extract*.
3. Vérifier la structure à la racine de `~/wondertours` : `server.js`, `node_modules/`, `public/`, `.next/` (dossier caché — l'afficher dans le gestionnaire, *Settings → Show hidden files*). Le tar inclut les fichiers cachés.

## 4. Variables d'environnement

Dans *Setup Node.js App* → **Environment variables** :

| Variable | Valeur |
|----------|-------|
| `DATABASE_URL` | URI **Aiven** (`…?sslmode=require` — le TLS est géré par `lib/db.ts`) |
| `AUTH_SECRET` | secret JWT du dashboard (**requis** ; `openssl rand -base64 32`) |
| `IMGBB_API_KEY` | recommandée — uploads persistants de la médiathèque |
| `DEEPL_API_KEY` | optionnelle — traduction DeepL (sinon la route répond 503) |
| `HOSTNAME` | `0.0.0.0` (recommandé — garantit un bind local même si l'hébergeur exporte `HOSTNAME`) |

`NODE_ENV` est géré par le mode Production de l'application — ne pas le définir. Après chaque modification : *Save* puis *Restart*.

## 5. Démarrer et vérifier

1. *Setup Node.js App* → **Restart**.
2. Premier hit lent possible (boot + connexion Aiven à froid — `lib/db.ts` tolère jusqu'à ~45 s).
3. Vérification depuis la machine locale :

```bash
bash scripts/smoke-api.sh https://<url-lws>   # 32+ vérifications : publics, auth, rôles, dashboard
```

> Note : le script lit `.env` **local** pour les comptes et purge ses lignes de test via `psql` — cela fonctionne tant que la base est joignable depuis la machine (Aiven : oui). Après une future bascule sur le PostgreSQL local LWS, l'accès distant étant généralement bloqué, la purge ne s'exécutera pas : supprimer les lignes `Smoke Test` via phpPgAdmin.

4. Dashboard : `https://<url-lws>/dashboard` → connexion admin (comptes présents dans la base Aiven).

## 6. Débogage Passenger

- **Page blanche / 503** : les erreurs d'exécution vont dans le log Apache — cPanel → *Errors* (ou *Metrics → Errors*) du domaine.
- Afficher l'erreur directement dans le navigateur le temps du diagnostic : dans le `.htaccess` du domaine (sous `public_html`), ajouter `PassengerFriendlyErrorPages on` — à retirer ensuite.
- Une **500 immédiate** au boot vient presque toujours d'une variable manquante (`AUTH_SECRET`) ou d'un bind raté (§4, `HOSTNAME`).
- Chaque changement de variable d'environnement exige un *Restart*.

## 7. Mises à jour

```bash
bash scripts/package-lws.sh --smoke        # nouveau bundle validé
```

Puis sur le serveur : supprimer les anciens répertoires remplacés avant extraction (évite l'accumulation de chunks obsolètes) :

```bash
cd ~/wondertours && rm -rf node_modules .next public server.js
# uploader le nouveau tar.gz puis :
tar -xzf wondertours-standalone-*.tar.gz -C ~/wondertours
```

*Restart* depuis cPanel, puis smoke test.

## 8. CI/CD GitHub Actions

Deux workflows (dossiers `.github/workflows/`) :

- **CI** (`ci.yml`) — à chaque push sur `master` et chaque PR : lint, typecheck, **tests sur un PostgreSQL 16 éphémère** (migrations + seed, aucune clé externe requise : imgBB/DeepL sont mockés), puis build avec vérification du bundle standalone. Statut visible dans l'onglet *Actions* du dépôt.
- **Package LWS** (`package-lws.yml`) :
  - **manuel** : onglet *Actions* → *Package LWS* → *Run workflow* → l'artefact `wondertours-lws-bundle` (30 jours de rétention) est téléchargeable depuis la page de la run ;
  - **sur tag** :

    ```bash
    git tag lws-v1.0.0 && git push origin lws-v1.0.0
    ```

    → le tar.gz est aussi publié en **GitHub Release** (pièce jointe).

Le mutualisé LWS n'expose ni SSH ni API de déploiement : **l'upload vers cPanel reste manuel** — l'artefact/Release sert de point de dépôt unique et reproductible (nommé avec la révision git + l'heure).

## 9. Bascule future vers le PostgreSQL local LWS *(documentée — pas encore requise)*

Avantage : latence minimale + sauvegardes quotidiennes LWS incluses. Le code **n'a pas besoin de modification** — une URI sans `sslmode` donne une connexion locale sans SSL (`lib/db.ts:29`).

1. **Créer la base** : cPanel → *PostgreSQL Databases* — base et utilisateur (noms préfixés par le compte, ex. `cpuser_wondertours` / `cpuser_wtadmin`), associer l'utilisateur à la base avec *ALL PRIVILEGES*.
2. **Créer le schéma** (sans connexion à la base — génère du SQL) :

   ```bash
   bunx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > schema-lws.sql
   ```

   Importer `schema-lws.sql` via phpPgAdmin (cPanel → *phpPgAdmin* → base → onglet *SQL*). L'accès distant au PostgreSQL étant bloqué sur le mutualisé, `prisma migrate deploy` **depuis la machine locale ne fonctionne pas**.
3. **Copier les données** : depuis la machine locale — `pg_dump` de la base Aiven, puis import du fichier dans phpPgAdmin (la base est petite ; via l'onglet *SQL* ou *Import*).
4. **Basculer** : changer `DATABASE_URL` dans cPanel vers `postgresql://cpuser_wtadmin:<motdepasse>@localhost:5432/cpuser_wondertours` (sans `sslmode`), *Save* + *Restart*, puis smoke test (cf. note §5 sur la purge).
5. Conserver Aiven en secours le temps de valider (rollback = remettre l'ancienne `DATABASE_URL`).

## 10. Domaine et SSL *(à définir)*

- Quand le domaine est choisi : le déclarer chez LWS, l'associer comme *Application URL* (§2).
- **AutoSSL** : cPanel → *SSL/TLS Status* → *Run AutoSSL* émet un certificat Let's Encrypt automatiquement.
- Mettre à jour `SITE_CONFIG.url` dans `lib/constants.ts` (utilisé par `lib/seo.ts` et le réglage `site_url` du seed), puis rebuild + repackage + redéployer.

## Limites et notes

- **Taille du bundle** (~83 Mo) : dominée par les images lourdes de `public/` — leur compression (déjà listée dans les limitations du README) réduira upload et extraction.
- Le nom de dossier `public/photos_site wonder_tours/` (avec espace) est transporté tel quel dans le tar.
- Pas de cache multi-instances à coordonner : un seul processus Passenger, cache disque local standard (`next start`-like) — aucune config supplémentaire requise.
- Les variables cPanel ne sont jamais versionnées — ce document est la seule référence des variables attendues (cf. README « Variables d'environnement »).
