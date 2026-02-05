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
        $clients = \App\Models\User::where('role', 'client')->get();
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

require __DIR__ . '/settings.php';
