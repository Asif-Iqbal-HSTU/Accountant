<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CorporationTax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CorporationTaxController extends Controller
{
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = CorporationTax::where('user_id', $userId);

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        return response()->json($query->orderBy('year', 'desc')->get());
    }

    public function store(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can manage corporation tax'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'year' => 'required|string',
            'ct600_file' => 'nullable|file|max:20480',
            'tax_computation_file' => 'nullable|file|max:20480',
            'liability_amount' => 'nullable|numeric',
            'payment_link' => 'nullable|string',
            'payment_reference' => 'nullable|string',
        ]);

        $data = [
            'user_id' => $request->user_id,
            'year' => $request->year,
            'liability_amount' => $request->liability_amount,
            'payment_link' => $request->payment_link,
            'payment_reference' => $request->payment_reference,
        ];

        if ($request->hasFile('ct600_file')) {
            $file = $request->file('ct600_file');
            $folder = 'corporation_tax/ct600/' . Str::uuid();
            $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');
            $data['ct600_file'] = '/storage/' . $path;
            $data['ct600_filename'] = $file->getClientOriginalName();
        }

        if ($request->hasFile('tax_computation_file')) {
            $file = $request->file('tax_computation_file');
            $folder = 'corporation_tax/computation/' . Str::uuid();
            $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');
            $data['tax_computation_file'] = '/storage/' . $path;
            $data['tax_computation_filename'] = $file->getClientOriginalName();
        }

        $record = CorporationTax::updateOrCreate(
            ['user_id' => $request->user_id, 'year' => $request->year],
            $data
        );

        return response()->json($record);
    }
}
