<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('country', 100)->nullable();
            $table->tinyInteger('rating');
            $table->text('text');
            $table->text('text_en')->nullable();
            $table->foreignUuid('circuit_id')->nullable()->constrained('circuits')->nullOnDelete();
            $table->string('avatar_url', 500)->nullable();
            $table->date('date')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->index('rating');
            $table->index('is_active');
            $table->index('is_featured');
        });
    }
    public function down(): void { Schema::dropIfExists('testimonials'); }
};
