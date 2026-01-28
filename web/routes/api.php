<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/accountants', [\App\Http\Controllers\Api\SearchController::class, 'searchAccountants']);
    Route::get('/clients', [\App\Http\Controllers\Api\SearchController::class, 'searchClients']);

    Route::get('/messages/{userId}', [\App\Http\Controllers\Api\MessageController::class, 'index']);
    Route::post('/messages', [\App\Http\Controllers\Api\MessageController::class, 'store']);
});
