<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('destinations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('name_en', 100)->nullable();
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('region', 100)->nullable();
            $table->decimal('coordinates_lat', 10, 8)->nullable();
            $table->decimal('coordinates_lng', 11, 8)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->index('is_active');
        });
    }
    public function down(): void { Schema::dropIfExists('destinations'); }
};
