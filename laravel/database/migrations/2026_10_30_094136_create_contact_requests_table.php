<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('contact_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 255);
            $table->string('email', 255);
            $table->string('phone', 50)->nullable();
            $table->string('subject', 255)->nullable();
            $table->enum('request_type', ['circuit', 'stay', 'hotel', 'info', 'other'])->default('info');
            $table->date('travel_date')->nullable();
            $table->integer('travelers')->nullable();
            $table->text('message')->nullable();
            $table->enum('status', ['new', 'in_progress', 'answered', 'closed'])->default('new');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->index('status');
            $table->index('created_at');
        });
    }
    public function down(): void { Schema::dropIfExists('contact_requests'); }
};
