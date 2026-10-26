<?php

declare(strict_types=1);

namespace WT;

/**
 * Source de vérité des colonnes : chaque constante associe la colonne
 * PostgreSQL (clé) à [clé camelCase JSON, type de sérialisation] — les
 * réponses reproduisent fidèlement la sortie Prisma (lib/db.ts).
 *
 * Types : raw (tel quel), bool ('t'/'f'), int, ts (timestamptz → ISO Z ms),
 * date (@db.Date → …T00:00:00.000Z), dec (numeric → chaîne normalisée),
 * json (colonne Json), str (force chaîne, ex. BigInt size).
 *
 * ⚠️ Motifs exclus volontairement : password_hash (users) n'est jamais
 * sérialisé, y compris pour l'auteur d'un article (divergence de sécurité
 * assumée par rapport à include:{author:true} côté Prisma).
 */
final class Model
{
    public const USER = [
        'id' => 'id',
        'email' => 'email',
        'first_name' => ['firstName', 'raw'],
        'last_name' => ['lastName', 'raw'],
        'role' => 'role',
        'is_active' => ['isActive', 'bool'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
        'last_login_at' => ['lastLoginAt', 'ts'],
    ];

    public const DESTINATION = [
        'id' => 'id',
        'name' => 'name',
        'name_en' => ['nameEn', 'raw'],
        'slug' => 'slug',
        'description' => 'description',
        'description_en' => ['descriptionEn', 'raw'],
        'image_url' => ['imageUrl', 'raw'],
        'country' => 'country',
        'region' => 'region',
        'coordinates_lat' => ['coordinatesLat', 'dec'],
        'coordinates_lng' => ['coordinatesLng', 'dec'],
        'is_active' => ['isActive', 'bool'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const CATEGORY = [
        'id' => 'id',
        'name' => 'name',
        'name_en' => ['nameEn', 'raw'],
        'slug' => 'slug',
        'description' => 'description',
        'description_en' => ['descriptionEn', 'raw'],
        'icon' => 'icon',
        'color' => 'color',
        'sort_order' => ['sortOrder', 'int'],
        'is_active' => ['isActive', 'bool'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const CIRCUIT = [
        'id' => 'id',
        'slug' => 'slug',
        'title' => 'title',
        'title_en' => ['titleEn', 'raw'],
        'subtitle' => 'subtitle',
        'subtitle_en' => ['subtitleEn', 'raw'],
        'description' => 'description',
        'description_en' => ['descriptionEn', 'raw'],
        'destination_id' => ['destinationId', 'raw'],
        'duration_days' => ['durationDays', 'int'],
        'duration_nights' => ['durationNights', 'int'],
        'price' => ['price', 'dec'],
        'currency' => 'currency',
        'image_url' => ['imageUrl', 'raw'],
        'gallery' => ['gallery', 'json'],
        'highlights' => ['highlights', 'json'],
        'highlights_en' => ['highlightsEn', 'json'],
        'itinerary' => ['itinerary', 'json'],
        'itinerary_en' => ['itineraryEn', 'json'],
        'included' => ['included', 'json'],
        'included_en' => ['includedEn', 'json'],
        'excluded' => ['excluded', 'json'],
        'excluded_en' => ['excludedEn', 'json'],
        'difficulty' => 'difficulty',
        'min_participants' => ['minParticipants', 'int'],
        'max_participants' => ['maxParticipants', 'int'],
        'is_featured' => ['isFeatured', 'bool'],
        'is_active' => ['isActive', 'bool'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
        'created_by' => ['createdBy', 'raw'],
    ];

    public const TESTIMONIAL = [
        'id' => 'id',
        'name' => 'name',
        'country' => 'country',
        'rating' => ['rating', 'int'],
        'text' => 'text',
        'text_en' => ['textEn', 'raw'],
        'circuit_id' => ['circuitId', 'raw'],
        'avatar_url' => ['avatarUrl', 'raw'],
        'date' => ['date', 'date'],
        'is_verified' => ['isVerified', 'bool'],
        'is_featured' => ['isFeatured', 'bool'],
        'is_active' => ['isActive', 'bool'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const BLOG_CATEGORY = [
        'id' => 'id',
        'name' => 'name',
        'name_en' => ['nameEn', 'raw'],
        'slug' => 'slug',
        'description' => 'description',
        'description_en' => ['descriptionEn', 'raw'],
        'color' => 'color',
        'sort_order' => ['sortOrder', 'int'],
        'is_active' => ['isActive', 'bool'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const BLOG_POST = [
        'id' => 'id',
        'slug' => 'slug',
        'title' => 'title',
        'title_en' => ['titleEn', 'raw'],
        'excerpt' => 'excerpt',
        'excerpt_en' => ['excerptEn', 'raw'],
        'content' => 'content',
        'content_en' => ['contentEn', 'raw'],
        'category_id' => ['categoryId', 'raw'],
        'author_id' => ['authorId', 'raw'],
        'image_url' => ['imageUrl', 'raw'],
        'gallery' => ['gallery', 'json'],
        'tags' => ['tags', 'json'],
        'read_time' => ['readTime', 'int'],
        'views' => ['views', 'int'],
        'is_featured' => ['isFeatured', 'bool'],
        'is_published' => ['isPublished', 'bool'],
        'published_at' => ['publishedAt', 'ts'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const SERVICE = [
        'id' => 'id',
        'title' => 'title',
        'title_en' => ['titleEn', 'raw'],
        'description' => 'description',
        'description_en' => ['descriptionEn', 'raw'],
        'icon' => 'icon',
        'href' => 'href',
        'sort_order' => ['sortOrder', 'int'],
        'is_active' => ['isActive', 'bool'],
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const BOOKING = [
        'id' => 'id',
        'booking_reference' => ['bookingReference', 'raw'],
        'type' => 'type',
        'circuit_id' => ['circuitId', 'raw'],
        'customer_name' => ['customerName', 'raw'],
        'customer_email' => ['customerEmail', 'raw'],
        'customer_phone' => ['customerPhone', 'raw'],
        'travel_date' => ['travelDate', 'date'],
        'return_date' => ['returnDate', 'date'],
        'participants' => ['participants', 'int'],
        'total_price' => ['totalPrice', 'dec'],
        'currency' => 'currency',
        'status' => 'status',
        'notes' => 'notes',
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const CONTACT_REQUEST = [
        'id' => 'id',
        'name' => 'name',
        'email' => 'email',
        'phone' => 'phone',
        'subject' => 'subject',
        'request_type' => ['requestType', 'raw'],
        'travel_date' => ['travelDate', 'date'],
        'travelers' => ['travelers', 'int'],
        'message' => 'message',
        'status' => 'status',
        'created_at' => ['createdAt', 'ts'],
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const SETTING = [
        'id' => 'id',
        'key' => 'key',
        'value' => 'value',
        'description' => 'description',
        'updated_at' => ['updatedAt', 'ts'],
    ];

    public const MEDIA_FILE = [
        'id' => 'id',
        'filename' => 'filename',
        'storage_path' => ['storagePath', 'raw'],
        'url' => 'url',
        'mime_type' => ['mimeType', 'raw'],
        'size' => ['size', 'str'],
        'width' => ['width', 'int'],
        'height' => ['height', 'int'],
        'alt_text' => ['altText', 'raw'],
        'alt_text_en' => ['altTextEn', 'raw'],
        'uploaded_by' => ['uploadedBy', 'raw'],
        'created_at' => ['createdAt', 'ts'],
    ];

    /**
     * Fragment SELECT pour une relation jointe : colonnes préfixées pour
     * éviter les collisions avec la table principale (ex. d.id → "d_id").
     */
    public static function prefixed(array $map, string $alias, string $prefix): string
    {
        $cols = [];
        foreach (array_keys($map) as $column) {
            $cols[] = sprintf('%s.%s AS "%s%s"', $alias, $column, $prefix, $column);
        }
        return implode(', ', $cols);
    }
}
