<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SelfAssessment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SelfAssessmentController extends Controller
{
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = SelfAssessment::where('user_id', $userId);

        if ($request->has('tax_year')) {
            $query->where('tax_year', $request->tax_year);
        }

        return response()->json($query->orderBy('tax_year', 'desc')->get());
    }

    public function store(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can manage self assessments'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'tax_year' => 'required|string',
            'tax_return_file' => 'nullable|file|max:20480',
            'liability_amount' => 'nullable|numeric',
            'payment_link' => 'nullable|string',
            'utr_number' => 'nullable|string',
        ]);

        $data = [
            'user_id' => $request->user_id,
            'tax_year' => $request->tax_year,
            'liability_amount' => $request->liability_amount,
            'payment_link' => $request->payment_link,
            'utr_number' => $request->utr_number,
        ];

        if ($request->hasFile('tax_return_file')) {
            $file = $request->file('tax_return_file');
            $folder = 'self_assessment/' . Str::uuid();
            $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');
            $data['tax_return_file'] = '/storage/' . $path;
            $data['tax_return_filename'] = $file->getClientOriginalName();
        }

        $record = SelfAssessment::updateOrCreate(
            ['user_id' => $request->user_id, 'tax_year' => $request->tax_year],
            $data
        );

        return response()->json($record);
    }
}
