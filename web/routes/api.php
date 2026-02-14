<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Legacy auth routes (kept for compatibility)
Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);

// New setup routes (no password required)
Route::post('/setup/profile', [\App\Http\Controllers\Api\SetupController::class, 'setupProfile']);
Route::post('/setup/check-email', [\App\Http\Controllers\Api\SetupController::class, 'checkEmail']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/accountants', [\App\Http\Controllers\Api\SearchController::class, 'searchAccountants']);
    Route::get('/clients', [\App\Http\Controllers\Api\SearchController::class, 'searchClients']);
    Route::post('/clients/{userId}/services', [\App\Http\Controllers\Api\ClientSettingsController::class, 'updateServices']);

    Route::get('/messages/{userId}', [\App\Http\Controllers\Api\MessageController::class, 'index']);
    Route::post('/messages', [\App\Http\Controllers\Api\MessageController::class, 'store']);
    Route::post('/messages/{id}/read', [\App\Http\Controllers\Api\MessageController::class, 'markAsRead']);
    Route::post('/messages/read-all/{senderId}', [\App\Http\Controllers\Api\MessageController::class, 'markAllRead']);
    Route::post('/messages/{id}/star', [\App\Http\Controllers\Api\MessageController::class, 'toggleStar']);
    Route::post('/messages/archive/{userId}', [\App\Http\Controllers\Api\MessageController::class, 'archiveConversation']);
    Route::post('/messages/typing/{receiverId}', [\App\Http\Controllers\Api\MessageController::class, 'setTyping']);
    Route::get('/messages/typing/{partnerId}', [\App\Http\Controllers\Api\MessageController::class, 'getTyping']);

    // Fetch user info for chat header
    Route::get('/users/{id}', function ($id) {
        $user = \App\Models\User::select('id', 'name', 'email')->find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }
        return response()->json($user);
    });

    // Document Management Routes
    Route::get('/documents', [\App\Http\Controllers\Api\DocumentController::class, 'index']); // List own documents
    Route::get('/documents/user/{userId}', [\App\Http\Controllers\Api\DocumentController::class, 'index']); // List user's documents (accountant)
    Route::get('/documents/stats', [\App\Http\Controllers\Api\DocumentController::class, 'stats']); // Own stats
    Route::get('/documents/stats/{userId}', [\App\Http\Controllers\Api\DocumentController::class, 'stats']); // User's stats (accountant)
    Route::get('/documents/{id}', [\App\Http\Controllers\Api\DocumentController::class, 'show']);
    Route::post('/documents', [\App\Http\Controllers\Api\DocumentController::class, 'store']); // Upload (supports bulk)
    Route::put('/documents/{id}', [\App\Http\Controllers\Api\DocumentController::class, 'update']);
    Route::delete('/documents/{id}', [\App\Http\Controllers\Api\DocumentController::class, 'destroy']);
    Route::post('/documents/{id}/status', [\App\Http\Controllers\Api\DocumentController::class, 'updateStatus']);
    Route::post('/documents/{id}/resubmit', [\App\Http\Controllers\Api\DocumentController::class, 'requestResubmission']);

    // Meeting Routes
    Route::apiResource('meetings', \App\Http\Controllers\Api\MeetingController::class);

    // ─── Accounting Management Routes ───

    // Company Info
    Route::get('/company-info', [\App\Http\Controllers\Api\ClientCompanyInfoController::class, 'show']);
    Route::get('/company-info/{userId}', [\App\Http\Controllers\Api\ClientCompanyInfoController::class, 'show']);
    Route::post('/company-info', [\App\Http\Controllers\Api\ClientCompanyInfoController::class, 'store']);

    // Payroll - Submissions
    Route::get('/payroll/submissions', [\App\Http\Controllers\Api\PayrollController::class, 'getSubmissions']);
    Route::post('/payroll/submissions', [\App\Http\Controllers\Api\PayrollController::class, 'submitHours']);
    Route::post('/payroll/submissions/{id}/payslip', [\App\Http\Controllers\Api\PayrollController::class, 'uploadEmployeePayslip']);

    // Payroll - Payslips
    Route::get('/payroll/payslips', [\App\Http\Controllers\Api\PayrollController::class, 'getPayslips']);
    Route::post('/payroll/payslips', [\App\Http\Controllers\Api\PayrollController::class, 'uploadPayslip']);

    // Payroll - Liabilities
    Route::get('/payroll/liabilities', [\App\Http\Controllers\Api\PayrollController::class, 'getLiabilities']);
    Route::post('/payroll/liabilities', [\App\Http\Controllers\Api\PayrollController::class, 'storeLiability']);

    // Payroll - Starter Form
    Route::get('/payroll/starter-form', [\App\Http\Controllers\Api\PayrollController::class, 'getStarterForm']);
    Route::post('/payroll/starter-form', [\App\Http\Controllers\Api\PayrollController::class, 'uploadStarterForm']);

    // Payroll - P60s and P45s
    Route::get('/payroll/p60-p45', [\App\Http\Controllers\Api\PayrollController::class, 'getP60P45']);
    Route::post('/payroll/p60-p45', [\App\Http\Controllers\Api\PayrollController::class, 'uploadP60P45']);

    // Accounts
    Route::get('/accounts', [\App\Http\Controllers\Api\AccountsController::class, 'index']);
    Route::post('/accounts', [\App\Http\Controllers\Api\AccountsController::class, 'store']);

    // Corporation Tax
    Route::get('/corporation-tax', [\App\Http\Controllers\Api\CorporationTaxController::class, 'index']);
    Route::post('/corporation-tax', [\App\Http\Controllers\Api\CorporationTaxController::class, 'store']);

    // VAT
    Route::get('/vat', [\App\Http\Controllers\Api\VatController::class, 'index']);
    Route::post('/vat', [\App\Http\Controllers\Api\VatController::class, 'store']);

    // Self Assessment
    Route::get('/self-assessment', [\App\Http\Controllers\Api\SelfAssessmentController::class, 'index']);
    Route::post('/self-assessment', [\App\Http\Controllers\Api\SelfAssessmentController::class, 'store']);
});
