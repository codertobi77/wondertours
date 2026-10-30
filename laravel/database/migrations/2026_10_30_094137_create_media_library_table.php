<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('media_library', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('filename', 255);
            $table->string('storage_path', 500);
            $table->string('url', 500);
            $table->string('mime_type', 100)->nullable();
            $table->bigInteger('size')->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->string('alt_text', 255)->nullable();
            $table->string('alt_text_en', 255)->nullable();
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }
    public function down(): void { Schema::dropIfExists('media_library'); }
};
