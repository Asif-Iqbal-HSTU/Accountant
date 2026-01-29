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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Owner (client)
            $table->foreignId('uploaded_by_id')->constrained('users')->onDelete('cascade'); // Who uploaded
            $table->string('filename'); // Original filename
            $table->string('filepath'); // Storage path
            $table->string('type')->default('file'); // file, image, receipt, invoice, bank_statement, contract
            $table->string('category')->nullable(); // expense, income, tax_document, other
            $table->enum('status', ['pending', 'reviewed', 'processed'])->default('pending');
            $table->unsignedBigInteger('folder_id')->nullable(); // For folder organization
            $table->json('ocr_data')->nullable(); // Extracted OCR data (date, merchant, amount, VAT)
            $table->json('tags')->nullable(); // Array of tags for custom organization
            $table->text('notes')->nullable(); // User notes
            $table->text('accountant_comment')->nullable(); // Accountant's comments
            $table->decimal('amount', 12, 2)->nullable(); // Extracted or manually entered amount
            $table->date('document_date')->nullable(); // Date on the document
            $table->string('merchant')->nullable(); // Merchant/vendor name (from OCR)
            $table->bigInteger('file_size')->nullable(); // File size in bytes
            $table->string('mime_type')->nullable(); // MIME type
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
