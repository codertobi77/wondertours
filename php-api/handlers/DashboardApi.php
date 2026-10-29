<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Circuits;
use WT\Crud;
use WT\Http;
use WT\Model;
use WT\Router;
use WT\Schemas;
use WT\Serial;
use WT\Support;

/**
 * Routes dashboard — enregistre chaque ressource CRUD (moteur WT\Crud).
 * Phase A : circuits (motifs figés) ; Phase B : destinations, categories,
 * testimonials, services, blog, blog-categories + endpoints dédiés.
 */
final class DashboardApi
{
    public static function registerRoutes(): void
    {
        // Circuits — destination jointe (d_) + catégories m-n en sérialisation
        // groupée (connect/set sur écritures) ; DELETE pré-lecture
        // (getCircuitById côté Next) → 404 « Circuit introuvable » (les paires
        // m-n partent via ON DELETE CASCADE).
        self::crud('circuits', '/api/dashboard/circuits', [
            'table' => 'circuits',
            'map' => Model::CIRCUIT,
            'serializer' => [Serial::class, 'circuit'],
            'label' => 'Circuit',
            'deletedMessage' => 'Circuit supprimé',
            'rebuild' => true,
            'search' => ['title', 'description'],
            'orderBy' => 't.is_featured DESC, t.created_at DESC',
            'slugTable' => 'circuit',
            'slugSource' => 'title',
            'joins' => 'LEFT JOIN destinations d ON d.id = t.destination_id',
            'relationColumns' => Model::prefixed(Model::DESTINATION, 'd', 'd_'),
            // Catégories m-n : sérialisation groupée + écritures connect/set.
            'relations' => [Circuits::class, 'attach'],
            'afterCreate' => [Circuits::class, 'connectFromData'],
            'afterUpdate' => [Circuits::class, 'setFromData'],
            'create' => [Schemas::class, 'circuitCreate'],
            'update' => [Schemas::class, 'circuitUpdate'],
            'deleteFetch' => true,
        ]);

        // Destinations — q sur nom/pays, tri par nom (listDestinations).
        self::crud('destinations', '/api/dashboard/destinations', [
            'table' => 'destinations',
            'map' => Model::DESTINATION,
            'serializer' => [Serial::class, 'destination'],
            'label' => 'Destination',
            'deletedMessage' => 'Destination supprimée',
            'rebuild' => true,
            'search' => ['name', 'country'],
            'orderBy' => 't.name ASC',
            'slugTable' => 'destination',
            'slugSource' => 'name',
            'create' => [Schemas::class, 'destinationCreate'],
            'update' => [Schemas::class, 'destinationUpdate'],
        ]);

        // Catégories circuits — q sur nom, tri sortOrder puis nom.
        self::crud('categories', '/api/dashboard/categories', [
            'table' => 'categories',
            'map' => Model::CATEGORY,
            'serializer' => [Serial::class, 'category'],
            'label' => 'Catégorie',
            'deletedMessage' => 'Catégorie supprimée',
            'rebuild' => true,
            'search' => ['name'],
            'orderBy' => 't.sort_order ASC, t.name ASC',
            'slugTable' => 'category',
            'slugSource' => 'name',
            'create' => [Schemas::class, 'categoryCreate'],
            'update' => [Schemas::class, 'categoryUpdate'],
        ]);

        // Témoignages — q sur nom/texte, mis en avant d'abord puis date.
        // Pas de slug ; PATCH convertit date ("" → NULL) via le validateur.
        self::crud('testimonials', '/api/dashboard/testimonials', [
            'table' => 'testimonials',
            'map' => Model::TESTIMONIAL,
            'serializer' => [Serial::class, 'testimonial'],
            'label' => 'Témoignage',
            'deletedMessage' => 'Témoignage supprimé',
            'rebuild' => true,
            'search' => ['name', 'text'],
            'orderBy' => 't.is_featured DESC, t.date DESC',
            'create' => [Schemas::class, 'testimonialCreate'],
            'update' => [Schemas::class, 'testimonialUpdate'],
        ]);

        // Services — q sur titre/description, tri sortOrder puis createdAt.
        self::crud('services', '/api/dashboard/services', [
            'table' => 'services',
            'map' => Model::SERVICE,
            'serializer' => [Serial::class, 'service'],
            'label' => 'Service',
            'deletedMessage' => 'Service supprimé',
            'rebuild' => true,
            'search' => ['title', 'description'],
            'orderBy' => 't.sort_order ASC, t.created_at ASC',
            'create' => [Schemas::class, 'serviceCreate'],
            'update' => [Schemas::class, 'serviceUpdate'],
        ]);

        // Articles — category + author joints (include Prisma), slug sur
        // titre, q sur titre/extrait, tri mis en avant puis publishedAt.
        // PATCH pré-lit la ligne (getBlogPostById) → 404 « Article
        // introuvable » ; publishedAt daté à la première publication.
        self::crud('blog', '/api/dashboard/blog', [
            'table' => 'blog_posts',
            'map' => Model::BLOG_POST,
            'serializer' => [Serial::class, 'blogPost'],
            'label' => 'Article',
            'deletedMessage' => 'Article supprimé',
            'rebuild' => true,
            'search' => ['title', 'excerpt'],
            'orderBy' => 't.is_featured DESC, t.published_at DESC',
            'slugTable' => 'blogPost',
            'slugSource' => 'title',
            'joins' => 'LEFT JOIN blog_categories bc ON bc.id = t.category_id'
                . ' LEFT JOIN users a ON a.id = t.author_id',
            'relationColumns' => Model::prefixed(Model::BLOG_CATEGORY, 'bc', 'bc_') . ', '
                . Model::prefixed(Model::USER, 'a', 'a_'),
            'create' => [Schemas::class, 'blogPostCreate'],
            'update' => [Schemas::class, 'blogPostUpdate'],
            'beforeCreate' => [self::class, 'blogPublishedAtCreate'],
            'patchFetch' => true,
            'beforeUpdate' => [self::class, 'blogPublishedAtUpdate'],
        ]);

        // Catégories blog — même gabarit que les catégories circuits
        // (table et messages distincts, slug « blogCategory »).
        self::crud('blog-categories', '/api/dashboard/blog-categories', [
            'table' => 'blog_categories',
            'map' => Model::BLOG_CATEGORY,
            'serializer' => [Serial::class, 'blogCategory'],
            'label' => 'Catégorie',
            'deletedMessage' => 'Catégorie supprimée',
            'rebuild' => true,
            'search' => ['name'],
            'orderBy' => 't.sort_order ASC, t.name ASC',
            'slugTable' => 'blogCategory',
            'slugSource' => 'name',
            'create' => [Schemas::class, 'blogCategoryCreate'],
            'update' => [Schemas::class, 'blogCategoryUpdate'],
        ]);

        // Publication manuelle : déclenche un rebuild du site (best-effort).
        Router::post('/api/dashboard/publish', [self::class, 'publish']);
    }

    /** Enregistre les 5 routes CRUD d'une ressource dashboard. */
    private static function crud(string $resource, string $path, array $spec): void
    {
        Crud::register($resource, $spec);
        Router::get($path, fn () => Crud::list($resource));
        Router::post($path, fn () => Crud::create($resource));
        Router::get($path . '/{id}', fn (string $id) => Crud::get($resource, $id));
        Router::patch($path . '/{id}', fn (string $id) => Crud::update($resource, $id));
        Router::delete($path . '/{id}', fn (string $id) => Crud::delete($resource, $id));
    }

    /** POST /api/dashboard/publish — déclenche un rebuild du site (admin+éditeur). */
    public static function publish(): never
    {
        Auth::requireSession(['admin', 'editor']);
        \WT\External::triggerRebuild(true);
        Http::ok(['message' => 'Rebuild du site déclenché', 'triggered' => true]);
    }

    // ─────────────────────── Règles métier blog (publishedAt) ───────────────────────

    /**
     * Création : publié d'emblée → publishedAt daté
     * (`...(body.isPublished ? { publishedAt: new Date() } : {})`).
     */
    public static function blogPublishedAtCreate(array $row, array $data): array
    {
        if (($data['isPublished'] ?? null) === true) {
            $row['published_at'] = Support::now();
        }
        return $row;
    }

    /**
     * PATCH : première publication seulement — publishedAt daté si
     * isPublished=true et jamais publié ; une dépublication garde la date.
     */
    public static function blogPublishedAtUpdate(array $row, ?array $existing, array $data): array
    {
        if (($data['isPublished'] ?? null) === true && ($existing['published_at'] ?? null) === null) {
            $row['published_at'] = Support::now();
        }
        return $row;
    }
}
