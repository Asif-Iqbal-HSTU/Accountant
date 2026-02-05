<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('accountant_id')->constrained('users')->onDelete('cascade');
            $table->string('title')->default('Meeting Request');
            $table->text('agenda')->nullable();
            $table->string('type'); // 'phone', 'video', 'in_person', 'quick_check_in'
            $table->string('urgency')->default('medium'); // 'low', 'medium', 'high', 'urgent'
            $table->string('status')->default('pending_accountant'); // 'pending_accountant', 'pending_client', 'confirmed', 'declined', 'cancelled', 'completed'
            $table->json('proposed_slots')->nullable(); // Array of ISO datetime strings
            $table->dateTime('confirmed_at')->nullable();
            $table->integer('duration_minutes')->default(30);
            $table->text('meeting_link')->nullable();
            $table->text('location')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
