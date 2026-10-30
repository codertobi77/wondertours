<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('booking_reference', 20)->unique();
            $table->enum('type', ['circuit', 'stay', 'hotel'])->default('circuit');
            $table->foreignUuid('circuit_id')->nullable()->constrained('circuits')->nullOnDelete();
            $table->string('customer_name', 255);
            $table->string('customer_email', 255);
            $table->string('customer_phone', 50)->nullable();
            $table->date('travel_date')->nullable();
            $table->date('return_date')->nullable();
            $table->integer('participants')->nullable();
            $table->decimal('total_price', 10, 2)->nullable();
            $table->string('currency', 3)->default('XOF');
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->index('status');
            $table->index('travel_date');
        });
    }
    public function down(): void { Schema::dropIfExists('bookings'); }
};
