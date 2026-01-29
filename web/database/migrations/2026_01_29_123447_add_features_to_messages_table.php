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
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->after('updated_at');
            $table->foreignId('parent_id')->nullable()->constrained('messages')->nullOnDelete()->after('id');
            $table->boolean('is_starred')->default(false)->after('read_at');
            $table->boolean('is_archived')->default(false)->after('is_starred');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['read_at', 'parent_id', 'is_starred', 'is_archived']);
        });
    }
};
