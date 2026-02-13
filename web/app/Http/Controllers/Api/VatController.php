<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VatRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class VatController extends Controller
{
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = VatRecord::where('user_id', $userId);

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }
        if ($request->has('quarter')) {
            $query->where('quarter', $request->quarter);
        }

        return response()->json($query->orderBy('year', 'desc')->orderBy('quarter', 'asc')->get());
    }

    public function store(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can manage VAT records'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'year' => 'required|string',
            'quarter' => 'required|integer|between:1,4',
            'vat_return_file' => 'nullable|file|max:20480',
            'liability_amount' => 'nullable|numeric',
            'payment_link' => 'nullable|string',
            'payment_reference' => 'nullable|string',
        ]);

        $data = [
            'user_id' => $request->user_id,
            'year' => $request->year,
            'quarter' => $request->quarter,
            'liability_amount' => $request->liability_amount,
            'payment_link' => $request->payment_link,
            'payment_reference' => $request->payment_reference,
        ];

        if ($request->hasFile('vat_return_file')) {
            $file = $request->file('vat_return_file');
            $folder = 'vat/' . Str::uuid();
            $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');
            $data['vat_return_file'] = '/storage/' . $path;
            $data['vat_return_filename'] = $file->getClientOriginalName();
        }

        $record = VatRecord::updateOrCreate(
            ['user_id' => $request->user_id, 'year' => $request->year, 'quarter' => $request->quarter],
            $data
        );

        return response()->json($record);
    }
}
