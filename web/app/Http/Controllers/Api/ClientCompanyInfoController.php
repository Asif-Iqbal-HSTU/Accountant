<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientCompanyInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ClientCompanyInfoController extends Controller
{
    /**
     * Get company info for the authenticated user (or a specific user for accountants)
     */
    public function show(Request $request, $userId = null)
    {
        $authUser = Auth::user();
        $targetUserId = $userId ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $targetUserId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $info = ClientCompanyInfo::where('user_id', $targetUserId)->first();

        return response()->json($info);
    }

    /**
     * Create or update company info
     */
    public function store(Request $request)
    {
        $authUser = Auth::user();

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'company_number' => 'nullable|string|max:255',
            'auth_code' => 'nullable|string|max:255',
            'incorporation_certificate' => 'nullable|file|max:10240',
            'ct_reference' => 'nullable|string|max:255',
            'vat_registration' => 'nullable|string|max:255',
            'paye_registration' => 'nullable|string|max:255',
            'accounts_office_ref' => 'nullable|string|max:255',
        ]);

        $targetUserId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $targetUserId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = collect($validated)->except(['user_id', 'incorporation_certificate'])->toArray();

        // Handle file upload
        if ($request->hasFile('incorporation_certificate')) {
            $file = $request->file('incorporation_certificate');
            $folder = 'company_info/' . Str::uuid();
            $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');
            $data['incorporation_certificate'] = '/storage/' . $path;
        }

        $info = ClientCompanyInfo::updateOrCreate(
            ['user_id' => $targetUserId],
            $data
        );

        return response()->json($info);
    }
}
