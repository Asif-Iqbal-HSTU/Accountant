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
        Schema::table('users', function (Blueprint $table) {
            // Make password nullable (no login required)
            $table->string('password')->nullable()->change();
            
            // Add new profile fields
            $table->string('firm_name')->nullable()->after('name'); // For accountants
            $table->string('occupation')->nullable()->after('firm_name'); // For clients
            $table->string('phone')->nullable()->after('email');
            
            // Device-based authentication
            $table->string('device_token')->nullable()->unique()->after('phone');
            
            // Profile setup tracking
            $table->boolean('setup_completed')->default(false)->after('device_token');
            
            // Additional profile fields
            $table->text('bio')->nullable()->after('setup_completed');
            $table->string('profile_photo')->nullable()->after('bio');
            
            // For SaaS - accountant subscription tracking (future)
            $table->string('subscription_status')->nullable()->after('profile_photo');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'firm_name',
                'occupation', 
                'phone',
                'device_token',
                'setup_completed',
                'bio',
                'profile_photo',
                'subscription_status',
                'subscription_expires_at'
            ]);
        });
    }
};
