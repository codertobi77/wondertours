-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `role` ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `email_verified` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    INDEX `password_reset_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `destinations` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `description_en` TEXT NULL,
    `image_url` VARCHAR(500) NULL,
    `country` VARCHAR(100) NULL,
    `region` VARCHAR(100) NULL,
    `coordinates_lat` DECIMAL(10, 8) NULL,
    `coordinates_lng` DECIMAL(11, 8) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `destinations_slug_key`(`slug`),
    INDEX `destinations_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `description_en` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `color` VARCHAR(7) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `circuits` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NULL,
    `subtitle` TEXT NULL,
    `subtitle_en` TEXT NULL,
    `description` TEXT NULL,
    `description_en` TEXT NULL,
    `destination_id` CHAR(36) NULL,
    `duration_days` INTEGER NULL,
    `duration_nights` INTEGER NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'XOF',
    `image_url` VARCHAR(500) NULL,
    `gallery` JSON NULL,
    `highlights` JSON NULL,
    `highlights_en` JSON NULL,
    `itinerary` JSON NULL,
    `itinerary_en` JSON NULL,
    `included` JSON NULL,
    `included_en` JSON NULL,
    `excluded` JSON NULL,
    `excluded_en` JSON NULL,
    `difficulty` ENUM('easy', 'moderate', 'challenging') NULL,
    `min_participants` INTEGER NULL,
    `max_participants` INTEGER NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    UNIQUE INDEX `circuits_slug_key`(`slug`),
    INDEX `circuits_slug_idx`(`slug`),
    INDEX `circuits_destination_id_idx`(`destination_id`),
    INDEX `circuits_is_active_idx`(`is_active`),
    INDEX `circuits_is_featured_idx`(`is_featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `country` VARCHAR(100) NULL,
    `rating` SMALLINT NOT NULL,
    `text` TEXT NOT NULL,
    `text_en` TEXT NULL,
    `circuit_id` CHAR(36) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `date` DATE NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `testimonials_rating_idx`(`rating`),
    INDEX `testimonials_is_active_idx`(`is_active`),
    INDEX `testimonials_is_featured_idx`(`is_featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `description_en` TEXT NULL,
    `color` VARCHAR(7) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blog_categories_slug_key`(`slug`),
    INDEX `blog_categories_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_posts` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NULL,
    `excerpt` TEXT NULL,
    `excerpt_en` TEXT NULL,
    `content` TEXT NULL,
    `content_en` TEXT NULL,
    `category_id` CHAR(36) NULL,
    `author_id` CHAR(36) NULL,
    `image_url` VARCHAR(500) NULL,
    `gallery` JSON NULL,
    `tags` JSON NULL,
    `read_time` INTEGER NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blog_posts_slug_key`(`slug`),
    INDEX `blog_posts_slug_idx`(`slug`),
    INDEX `blog_posts_category_id_idx`(`category_id`),
    INDEX `blog_posts_is_published_idx`(`is_published`),
    INDEX `blog_posts_is_featured_idx`(`is_featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `description_en` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `href` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `services_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` CHAR(36) NOT NULL,
    `booking_reference` VARCHAR(20) NOT NULL,
    `type` ENUM('circuit', 'stay', 'hotel') NOT NULL DEFAULT 'circuit',
    `circuit_id` CHAR(36) NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_email` VARCHAR(255) NOT NULL,
    `customer_phone` VARCHAR(50) NULL,
    `travel_date` DATE NULL,
    `return_date` DATE NULL,
    `participants` INTEGER NULL,
    `total_price` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'XOF',
    `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bookings_booking_reference_key`(`booking_reference`),
    INDEX `bookings_status_idx`(`status`),
    INDEX `bookings_travel_date_idx`(`travel_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_requests` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `subject` VARCHAR(255) NULL,
    `request_type` ENUM('circuit', 'stay', 'hotel', 'info', 'other') NOT NULL DEFAULT 'info',
    `travel_date` DATE NULL,
    `travelers` INTEGER NULL,
    `message` TEXT NULL,
    `status` ENUM('new', 'in_progress', 'answered', 'closed') NOT NULL DEFAULT 'new',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_requests_status_idx`(`status`),
    INDEX `contact_requests_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `description` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_library` (
    `id` CHAR(36) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `storage_path` VARCHAR(500) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100) NULL,
    `size` BIGINT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `alt_text` VARCHAR(255) NULL,
    `alt_text_en` VARCHAR(255) NULL,
    `uploaded_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CategoryToCircuit` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_CategoryToCircuit_AB_unique`(`A`, `B`),
    INDEX `_CategoryToCircuit_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `circuits` ADD CONSTRAINT `circuits_destination_id_fkey` FOREIGN KEY (`destination_id`) REFERENCES `destinations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `circuits` ADD CONSTRAINT `circuits_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_circuit_id_fkey` FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_circuit_id_fkey` FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_library` ADD CONSTRAINT `media_library_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CategoryToCircuit` ADD CONSTRAINT `_CategoryToCircuit_A_fkey` FOREIGN KEY (`A`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CategoryToCircuit` ADD CONSTRAINT `_CategoryToCircuit_B_fkey` FOREIGN KEY (`B`) REFERENCES `circuits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
