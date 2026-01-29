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
});
