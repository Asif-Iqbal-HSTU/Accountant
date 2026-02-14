<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('setup', function () {
    return Inertia::render('setup/accountant');
})->name('setup');

Route::post('setup', [\App\Http\Controllers\SetupController::class, 'setupAccountant'])->name('setup.submit');

Route::get('dashboard', function () {
    $clients = [];
    if (auth()->user()->role === 'accountant') {
        $clients = \App\Models\User::where('role', 'client')
            ->with('companyInfo')
            ->withCount(['sentMessages as unread_count' => function ($q) {
                $q->where('receiver_id', \Illuminate\Support\Facades\Auth::id())
                  ->whereNull('read_at');
            }])
            ->get();
    }
    return Inertia::render('dashboard', [
        'clients' => $clients
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('documents', function () {
    $clients = [];
    if (auth()->user()->role === 'accountant') {
        $clients = \App\Models\User::where('role', 'client')->get();
    }
    return Inertia::render('documents', [
        'clients' => $clients
    ]);
})->middleware(['auth', 'verified'])->name('documents');

Route::get('meetings', function () {
    return Inertia::render('meetings/index');
})->middleware(['auth', 'verified'])->name('meetings');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('accounting', function () {
        return Inertia::render('accounting/index');
    })->name('accounting');

    Route::get('accounting/company-info', function () {
        return Inertia::render('accounting/company-info');
    })->name('accounting.company-info');

    Route::get('accounting/payroll', function () {
        return Inertia::render('accounting/payroll');
    })->name('accounting.payroll');

    Route::get('accounting/accounts', function () {
        return Inertia::render('accounting/accounts');
    })->name('accounting.accounts');

    Route::get('accounting/corporation-tax', function () {
        return Inertia::render('accounting/corporation-tax');
    })->name('accounting.corporation-tax');

    Route::get('accounting/vat', function () {
        return Inertia::render('accounting/vat');
    })->name('accounting.vat');

    Route::get('accounting/self-assessment', function () {
        return Inertia::render('accounting/self-assessment');
    })->name('accounting.self-assessment');

    Route::get('clients/{userId}/accounting/company-info', function ($userId) {
        $client = \App\Models\User::findOrFail($userId);
        return Inertia::render('accounting/company-info', [
            'userId' => $client->id,
            'clientName' => $client->name,
        ]);
    })->name('clients.accounting.company-info');

    Route::get('clients/{userId}/accounting/payroll', function ($userId) {
        $client = \App\Models\User::findOrFail($userId);
        return Inertia::render('accounting/payroll', [
            'userId' => $client->id,
            'clientName' => $client->name,
        ]);
    })->name('clients.accounting.payroll');
});

require __DIR__ . '/settings.php';
