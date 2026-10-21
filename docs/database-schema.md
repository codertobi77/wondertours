# Schéma de Base de Données - Wonder Tours Dashboard

Ce document détaille les tables nécessaires pour le backend et le dashboard de gestion du site Wonder Tours.

---

## 1. Table: `users`
Gestion des administrateurs et utilisateurs du dashboard.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| email | VARCHAR(255) UNIQUE | Email de connexion |
| password_hash | VARCHAR(255) | Mot de passe hashé |
| first_name | VARCHAR(100) | Prénom |
| last_name | VARCHAR(100) | Nom |
| role | ENUM('admin', 'editor', 'viewer') | Rôle de l'utilisateur |
| is_active | BOOLEAN | Compte actif ou non |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |
| last_login_at | TIMESTAMP | Dernière connexion |

---

## 2. Table: `circuits`
Gestion des circuits touristiques.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| slug | VARCHAR(255) UNIQUE | Slug pour l'URL |
| title | VARCHAR(255) | Titre du circuit |
| title_en | VARCHAR(255) | Titre en anglais |
| subtitle | TEXT | Sous-titre |
| subtitle_en | TEXT | Sous-titre en anglais |
| description | TEXT | Description complète |
| description_en | TEXT | Description en anglais |
| destination_id | UUID (FK) | Destination (réf: destinations) |
| duration_days | INTEGER | Durée en jours |
| duration_nights | INTEGER | Durée en nuits |
| price | DECIMAL(10,2) | Prix par personne |
| currency | VARCHAR(3) | Devise (XOF, EUR, USD) |
| image_url | VARCHAR(500) | URL de l'image principale |
| gallery | JSONB | Tableau d'URLs d'images |
| highlights | JSONB | Points forts (tableau de strings) |
| highlights_en | JSONB | Points forts en anglais |
| itinerary | JSONB | Programme détaillé (jours/étapes) |
| itinerary_en | JSONB | Programme détaillé en anglais |
| included | JSONB | Services inclus |
| included_en | JSONB | Services inclus en anglais |
| excluded | JSONB | Services non inclus |
| excluded_en | JSONB | Services non inclus en anglais |
| difficulty | ENUM('easy', 'moderate', 'challenging') | Niveau de difficulté |
| min_participants | INTEGER | Nombre minimum de participants |
| max_participants | INTEGER | Nombre maximum de participants |
| is_featured | BOOLEAN | Mis en avant sur l'accueil |
| is_active | BOOLEAN | Circuit actif/visible |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |
| created_by | UUID (FK) | Créateur (réf: users) |

**Catégories multiples** : un circuit appartient à 0..N catégories via la table de jointure implicite `_CategoryToCircuit` (`A` = category_id, `B` = circuit_id, clé primaire `(A, B)`, `ON DELETE CASCADE` des deux côtés). L'ancienne colonne unique `category_id` a été supprimée (les affectations existantes ont été reprises dans la jointure).

---

## 3. Table: `destinations`
Gestion des destinations touristiques.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | VARCHAR(100) | Nom de la destination |
| name_en | VARCHAR(100) | Nom en anglais |
| slug | VARCHAR(100) UNIQUE | Slug pour l'URL |
| description | TEXT | Description |
| description_en | TEXT | Description en anglais |
| image_url | VARCHAR(500) | URL de l'image |
| country | VARCHAR(100) | Pays |
| region | VARCHAR(100) | Région |
| coordinates_lat | DECIMAL(10,8) | Latitude |
| coordinates_lng | DECIMAL(11,8) | Longitude |
| is_active | BOOLEAN | Destination active |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 4. Table: `categories`
Gestion des catégories de circuits.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | VARCHAR(100) | Nom de la catégorie |
| name_en | VARCHAR(100) | Nom en anglais |
| slug | VARCHAR(100) UNIQUE | Slug pour l'URL |
| description | TEXT | Description |
| description_en | TEXT | Description en anglais |
| icon | VARCHAR(50) | Nom de l'icône (Lucide) |
| color | VARCHAR(7) | Code couleur hex |
| sort_order | INTEGER | Ordre d'affichage |
| is_active | BOOLEAN | Catégorie active |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 5. Table: `testimonials`
Gestion des témoignages clients.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | VARCHAR(100) | Nom du client |
| country | VARCHAR(100) | Pays d'origine |
| rating | INTEGER(1-5) | Note (1 à 5 étoiles) |
| text | TEXT | Témoignage |
| text_en | TEXT | Témoignage en anglais |
| circuit_id | UUID (FK) | Circuit concerné (optionnel, réf: circuits) |
| avatar_url | VARCHAR(500) | URL de la photo du client |
| date | DATE | Date du témoignage |
| is_verified | BOOLEAN | Témoignage vérifié |
| is_featured | BOOLEAN | Mis en avant |
| is_active | BOOLEAN | Témoignage visible |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 6. Table: `blog_posts`
Gestion des articles de blog.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| slug | VARCHAR(255) UNIQUE | Slug pour l'URL |
| title | VARCHAR(255) | Titre de l'article |
| title_en | VARCHAR(255) | Titre en anglais |
| excerpt | TEXT | Extrait |
| excerpt_en | TEXT | Extrait en anglais |
| content | TEXT | Contenu complet (HTML/Markdown) |
| content_en | TEXT | Contenu en anglais |
| category_id | UUID (FK) | Catégorie (réf: blog_categories) |
| author_id | UUID (FK) | Auteur (réf: users) |
| image_url | VARCHAR(500) | URL de l'image de couverture |
| gallery | JSONB | Tableau d'URLs d'images |
| tags | JSONB | Tableau de tags |
| read_time | INTEGER | Temps de lecture (minutes) |
| views | INTEGER | Nombre de vues |
| is_featured | BOOLEAN | Mis en avant |
| is_published | BOOLEAN | Article publié |
| published_at | TIMESTAMP | Date de publication |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 7. Table: `blog_categories`
Gestion des catégories du blog.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | VARCHAR(100) | Nom de la catégorie |
| name_en | VARCHAR(100) | Nom en anglais |
| slug | VARCHAR(100) UNIQUE | Slug pour l'URL |
| description | TEXT | Description |
| description_en | TEXT | Description en anglais |
| color | VARCHAR(7) | Code couleur hex |
| sort_order | INTEGER | Ordre d'affichage |
| is_active | BOOLEAN | Catégorie active |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 8. Table: `services`
Gestion des services proposés.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| title | VARCHAR(255) | Titre du service |
| title_en | VARCHAR(255) | Titre en anglais |
| description | TEXT | Description |
| description_en | TEXT | Description en anglais |
| icon | VARCHAR(50) | Nom de l'icône (Lucide) |
| href | VARCHAR(255) | Lien vers la page |
| sort_order | INTEGER | Ordre d'affichage |
| is_active | BOOLEAN | Service actif |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 9. Table: `bookings`
Gestion des réservations.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| booking_reference | VARCHAR(20) UNIQUE | Référence de réservation |
| type | ENUM('circuit', 'stay', 'hotel') | Type de réservation |
| circuit_id | UUID (FK) | Circuit (réf: circuits) |
| customer_name | VARCHAR(255) | Nom du client |
| customer_email | VARCHAR(255) | Email du client |
| customer_phone | VARCHAR(50) | Téléphone du client |
| travel_date | DATE | Date de voyage |
| return_date | DATE | Date de retour |
| participants | INTEGER | Nombre de participants |
| total_price | DECIMAL(10,2) | Prix total |
| currency | VARCHAR(3) | Devise |
| status | ENUM('pending', 'confirmed', 'cancelled', 'completed') | Statut |
| notes | TEXT | Notes additionnelles |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 10. Table: `contact_requests`
Gestion des demandes de contact.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | VARCHAR(255) | Nom |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(50) | Téléphone |
| subject | VARCHAR(255) | Sujet |
| request_type | ENUM('circuit', 'stay', 'hotel', 'info', 'other') | Type de demande |
| travel_date | DATE | Date de voyage souhaitée |
| travelers | INTEGER | Nombre de voyageurs |
| message | TEXT | Message |
| status | ENUM('new', 'in_progress', 'answered', 'closed') | Statut |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## 11. Table: `settings`
Gestion des paramètres du site.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| key | VARCHAR(100) UNIQUE | Clé du paramètre |
| value | TEXT | Valeur (JSON ou texte) |
| description | TEXT | Description |
| updated_at | TIMESTAMP | Date de mise à jour |

Exemples de clés:
- `site_name`: Nom du site
- `site_description`: Description du site
- `contact_email`: Email de contact
- `contact_phone`: Téléphone
- `contact_address`: Adresse
- `social_facebook`: URL Facebook
- `social_instagram`: URL Instagram
- `social_youtube`: URL YouTube
- `whatsapp_number`: Numéro WhatsApp

---

## 12. Table: `media_library`
Gestion de la médiathèque (images, documents).

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| filename | VARCHAR(255) | Nom du fichier original |
| storage_path | VARCHAR(500) | Chemin de stockage |
| url | VARCHAR(500) | URL publique |
| mime_type | VARCHAR(100) | Type MIME |
| size | BIGINT | Taille en octets |
| width | INTEGER | Largeur (pour images) |
| height | INTEGER | Hauteur (pour images) |
| alt_text | VARCHAR(255) | Texte alternatif |
| alt_text_en | VARCHAR(255) | Texte alternatif en anglais |
| uploaded_by | UUID (FK) | Uploader (réf: users) |
| created_at | TIMESTAMP | Date de création |

---

## Relations entre les tables

```
users (1) ──< (N) circuits (created_by)
users (1) ──< (N) blog_posts (author)

destinations (1) ──< (N) circuits
categories (N) ──< (M) circuits   (via _CategoryToCircuit)
circuits (1) ──< (N) testimonials
circuits (1) ──< (N) bookings

blog_categories (1) ──< (N) blog_posts
users (1) ──< (N) blog_posts (author)
users (1) ──< (N) media_library (uploaded_by)
```

---

## Index recommandés

```sql
-- Circuits
CREATE INDEX idx_circuits_slug ON circuits(slug);
CREATE INDEX idx_circuits_destination ON circuits(destination_id);
CREATE INDEX idx_circuits_active ON circuits(is_active);
CREATE INDEX idx_circuits_featured ON circuits(is_featured);

-- Jointure m-n circuits ↔ categories (_CategoryToCircuit)
CREATE INDEX idx_category_to_circuit_b ON "_CategoryToCircuit"("B");

-- Blog posts
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX idx_blog_posts_featured ON blog_posts(is_featured);

-- Testimonials
CREATE INDEX idx_testimonials_rating ON testimonials(rating);
CREATE INDEX idx_testimonials_active ON testimonials(is_active);
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured);

-- Bookings
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(travel_date);

-- Contact requests
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_created ON contact_requests(created_at);
```

---

## Technologies recommandées

- **Base de données**: PostgreSQL (pour JSONB et relations complexes)
- **ORM**: Prisma (TypeScript-first, excellent pour Next.js)
- **API**: Next.js API Routes ou tRPC
- **Auth**: NextAuth.js ou Clerk
- **File Storage**: AWS S3, Cloudflare R2 ou Vercel Blob
- **Dashboard**: shadcn/ui + React Table (TanStack Table)
