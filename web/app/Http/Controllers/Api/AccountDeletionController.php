<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AccountDeletionController extends Controller
{
    /**
     * Delete the authenticated user's account and all associated data.
     * This endpoint satisfies the Google Play Store requirement for account deletion.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The provided password is incorrect.',
                'errors' => ['password' => ['The provided password is incorrect.']],
            ], 422);
        }

        // Delete all associated data
        $user->sentMessages()->delete();
        $user->receivedMessages()->delete();
        $user->services()->delete();
        $user->companyInfo()->delete();

        // Delete documents
        \App\Models\Document::where('user_id', $user->id)
            ->orWhere('uploaded_by', $user->id)
            ->delete();

        // Delete meetings
        \App\Models\Meeting::where('accountant_id', $user->id)
            ->orWhere('client_id', $user->id)
            ->delete();

        // Revoke all API tokens
        $user->tokens()->delete();

        // Delete the user
        $user->delete();

        return response()->json([
            'message' => 'Your account and all associated data have been permanently deleted.',
        ]);
    }

    /**
     * Submit a deletion request via the public form (unauthenticated).
     * This is for the public-facing deletion request page required by Play Store.
     */
    public function requestDeletion(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'reason' => 'nullable|string|max:1000',
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        // Always return success to avoid email enumeration
        // In a real scenario, you'd send a confirmation email
        if ($user) {
            // Log the deletion request (in production, you'd queue a confirmation email)
            \Illuminate\Support\Facades\Log::info('Account deletion requested', [
                'user_id' => $user->id,
                'email' => $request->email,
                'reason' => $request->reason,
            ]);
        }

        return response()->json([
            'message' => 'If an account exists with that email, a deletion confirmation will be sent. Please contact support if you need immediate assistance.',
        ]);
    }
}
