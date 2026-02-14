<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientSettingsController extends Controller
{
    public function updateServices(Request $request, $userId)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can manage client services'], 403);
        }

        $client = User::findOrFail($userId);

        if ($client->role !== 'client') {
            return response()->json(['error' => 'Can only manage services for clients'], 400);
        }

        $request->validate([
            'services' => 'required|array',
            'services.payroll' => 'boolean',
            'services.accounts' => 'boolean',
            'services.corporation_tax' => 'boolean',
            'services.vat' => 'boolean',
            'services.self_assessment' => 'boolean',
        ]);

        foreach ($request->services as $service => $isActive) {
            $client->services()->updateOrCreate(
                ['service' => $service],
                ['is_active' => $isActive]
            );
        }
        
        // Refresh client services to return the correct state
        $client->load('services');

        return response()->json([
            'message' => 'Services updated successfully',
            'user' => $client
        ]);
    }
}
