<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

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

require __DIR__ . '/settings.php';
