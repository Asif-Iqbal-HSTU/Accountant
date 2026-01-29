<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('type')->default('text'); // text, image, file, audio
            $table->string('attachment_path')->nullable();
            $table->text('content')->nullable()->change(); // Content can be null if only attachment
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['type', 'attachment_path']);
            $table->text('content')->nullable(false)->change();
        });
    }
};
