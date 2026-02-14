<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Client Company Information
        Schema::create('client_company_info', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('company_number')->nullable();
            $table->string('auth_code')->nullable();
            $table->string('incorporation_certificate')->nullable(); // file path
            $table->string('ct_reference')->nullable();
            $table->string('vat_registration')->nullable();
            $table->string('paye_registration')->nullable();
            $table->string('accounts_office_ref')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });

        // Payroll Submissions (Submit Hours)
        Schema::create('payroll_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('month'); // April, May, etc.
            $table->string('year'); // e.g. "2024/2025"
            $table->string('name')->nullable();
            $table->string('hours')->nullable();
            $table->string('holidays')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'processed'])->default('pending');
            $table->string('payslip_file_path')->nullable();
            $table->string('payslip_filename')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'year', 'month']);
        });

        // Payslips
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('month');
            $table->string('year');
            $table->string('file_path');
            $table->string('filename')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'year', 'month']);
        });

        // Payroll Liabilities
        Schema::create('payroll_liabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('month');
            $table->string('year');
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('payment_link')->nullable();
            $table->string('payment_reference')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'year', 'month']);
        });

        // Starter Forms
        Schema::create('starter_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('file_path');
            $table->string('filename')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // P60s and P45s
        Schema::create('p60s_p45s', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('tax_year'); // e.g. "2023/2024"
            $table->enum('type', ['p60', 'p45']);
            $table->string('file_path');
            $table->string('filename')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'tax_year']);
        });

        // Accounts
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('year'); // e.g. "2023"
            $table->string('file_path');
            $table->string('filename')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'year']);
        });

        // Corporation Tax
        Schema::create('corporation_tax', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('year'); // e.g. "2023"
            $table->string('ct600_file')->nullable();
            $table->string('ct600_filename')->nullable();
            $table->string('tax_computation_file')->nullable();
            $table->string('tax_computation_filename')->nullable();
            $table->decimal('liability_amount', 12, 2)->nullable();
            $table->string('payment_link')->nullable();
            $table->string('payment_reference')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'year']);
        });

        // VAT Records
        Schema::create('vat_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('year'); // e.g. "2025"
            $table->tinyInteger('quarter'); // 1, 2, 3, 4
            $table->string('vat_return_file')->nullable();
            $table->string('vat_return_filename')->nullable();
            $table->decimal('liability_amount', 12, 2)->nullable();
            $table->string('payment_link')->nullable();
            $table->string('payment_reference')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'year', 'quarter']);
        });

        // Self Assessments
        Schema::create('self_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('tax_year'); // e.g. "2023/2024"
            $table->string('tax_return_file')->nullable();
            $table->string('tax_return_filename')->nullable();
            $table->decimal('liability_amount', 12, 2)->nullable();
            $table->string('payment_link')->nullable();
            $table->string('utr_number')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'tax_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('self_assessments');
        Schema::dropIfExists('vat_records');
        Schema::dropIfExists('corporation_tax');
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('p60s_p45s');
        Schema::dropIfExists('starter_forms');
        Schema::dropIfExists('payroll_liabilities');
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_submissions');
        Schema::dropIfExists('client_company_info');
    }
};
