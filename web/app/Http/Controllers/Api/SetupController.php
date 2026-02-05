<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SetupController extends Controller
{
    /**
     * Setup profile for a new user (no registration required)
     */
    public function setupProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'role' => 'required|in:accountant,client',
            'firm_name' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'bio' => 'nullable|string|max:1000',
        ]);

        // Check if user with this email exists
        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Update existing user
            $user->update([
                'name' => $request->name,
                'firm_name' => $request->firm_name,
                'occupation' => $request->occupation,
                'phone' => $request->phone,
                'bio' => $request->bio,
                'setup_completed' => true,
            ]);
        } else {
            // Create new user without password
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'role' => $request->role,
                'firm_name' => $request->firm_name,
                'occupation' => $request->occupation,
                'phone' => $request->phone,
                'bio' => $request->bio,
                'device_token' => Str::random(64),
                'setup_completed' => true,
            ]);
        }

        // Generate API token
        $token = $user->createToken('app-token')->plainTextToken;

        return response()->json([
            'message' => 'Profile setup successful',
            'user' => $user,
            'access_token' => $token,
        ]);
    }

    /**
     * Update profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'firm_name' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'bio' => 'nullable|string|max:1000',
        ]);

        $user->update($request->only([
            'name',
            'firm_name',
            'occupation',
            'phone',
            'bio',
        ]));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Get current user profile
     */
    public function getProfile(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Check if email exists and get user info for auto-login
     */
    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user && $user->setup_completed) {
            return response()->json([
                'exists' => true,
                'user' => [
                    'name' => $user->name,
                    'role' => $user->role,
                    'firm_name' => $user->firm_name,
                    'occupation' => $user->occupation,
                ],
            ]);
        }

        return response()->json([
            'exists' => false,
        ]);
    }
}
