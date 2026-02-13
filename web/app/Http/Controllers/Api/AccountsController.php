<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AccountsController extends Controller
{
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = Account::where('user_id', $userId);

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        return response()->json($query->orderBy('year', 'desc')->get());
    }

    public function store(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can upload accounts'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'year' => 'required|string',
            'file' => 'required|file|max:20480',
        ]);

        $file = $request->file('file');
        $folder = 'accounts/' . Str::uuid();
        $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');

        $account = Account::create([
            'user_id' => $request->user_id,
            'year' => $request->year,
            'file_path' => '/storage/' . $path,
            'filename' => $file->getClientOriginalName(),
        ]);

        return response()->json($account);
    }
}
