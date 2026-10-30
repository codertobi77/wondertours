<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 255)->unique();
            $table->string('title', 255);
            $table->string('title_en', 255)->nullable();
            $table->text('excerpt')->nullable();
            $table->text('excerpt_en')->nullable();
            $table->text('content')->nullable();
            $table->text('content_en')->nullable();
            $table->foreignUuid('category_id')->nullable()->constrained('blog_categories')->nullOnDelete();
            $table->foreignUuid('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('image_url', 500)->nullable();
            $table->json('gallery')->nullable();
            $table->json('tags')->nullable();
            $table->integer('read_time')->nullable();
            $table->integer('views')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->index('slug');
            $table->index('category_id');
            $table->index('is_published');
            $table->index('is_featured');
        });
    }
    public function down(): void { Schema::dropIfExists('blog_posts'); }
};
