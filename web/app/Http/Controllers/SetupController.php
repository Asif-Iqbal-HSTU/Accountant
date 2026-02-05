<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SetupController extends Controller
{
    /**
     * Setup profile for a new accountant (web-based, creates session)
     */
    public function setupAccountant(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'firm_name' => 'required|string|max:255',
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
                'phone' => $request->phone,
                'bio' => $request->bio,
                'role' => 'accountant',
                'setup_completed' => true,
                'email_verified_at' => now(), // Auto-verify for setup flow
            ]);
        } else {
            // Create new user without password
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'role' => 'accountant',
                'firm_name' => $request->firm_name,
                'phone' => $request->phone,
                'bio' => $request->bio,
                'device_token' => Str::random(64),
                'setup_completed' => true,
                'email_verified_at' => now(), // Auto-verify for setup flow
            ]);
        }

        // Log the user in (creates session)
        Auth::login($user, true); // Remember me = true

        return response()->json([
            'success' => true,
            'message' => 'Profile setup successful',
            'redirect' => '/dashboard',
        ]);
    }
}
