<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('circuits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 255)->unique();
            $table->string('title', 255);
            $table->string('title_en', 255)->nullable();
            $table->text('subtitle')->nullable();
            $table->text('subtitle_en')->nullable();
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();
            $table->foreignUuid('destination_id')->nullable()->constrained('destinations')->nullOnDelete();
            $table->integer('duration_days')->nullable();
            $table->integer('duration_nights')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('XOF');
            $table->string('image_url', 500)->nullable();
            $table->json('gallery')->nullable();
            $table->json('highlights')->nullable();
            $table->json('highlights_en')->nullable();
            $table->json('itinerary')->nullable();
            $table->json('itinerary_en')->nullable();
            $table->json('included')->nullable();
            $table->json('included_en')->nullable();
            $table->json('excluded')->nullable();
            $table->json('excluded_en')->nullable();
            $table->string('difficulty', 20)->nullable();
            $table->integer('min_participants')->nullable();
            $table->integer('max_participants')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->index('slug');
            $table->index('destination_id');
            $table->index('is_active');
            $table->index('is_featured');
        });
        Schema::create('circuit_category', function (Blueprint $table) {
            $table->foreignUuid('circuit_id')->constrained('circuits')->cascadeOnDelete();
            $table->foreignUuid('category_id')->constrained('categories')->cascadeOnDelete();
            $table->primary(['circuit_id', 'category_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('circuit_category');
        Schema::dropIfExists('circuits');
    }
};
