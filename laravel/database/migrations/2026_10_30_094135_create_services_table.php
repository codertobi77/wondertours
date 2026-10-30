<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 255);
            $table->string('title_en', 255)->nullable();
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();
            $table->string('icon', 50)->nullable();
            $table->string('href', 255)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->index('is_active');
        });
    }
    public function down(): void { Schema::dropIfExists('services'); }
};
