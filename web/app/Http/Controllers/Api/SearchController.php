<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function searchAccountants(Request $request)
    {
        $query = User::where('role', 'accountant')
            ->withCount(['sentMessages as unread_count' => function ($q) {
                $q->where('receiver_id', \Illuminate\Support\Facades\Auth::id())
                  ->whereNull('read_at');
            }]);

        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        return response()->json($query->get());
    }

    public function searchClients(Request $request)
    {
        $query = User::where('role', 'client')
            ->withCount(['sentMessages as unread_count' => function ($q) {
                $q->where('receiver_id', \Illuminate\Support\Facades\Auth::id())
                  ->whereNull('read_at');
            }]);

        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        return response()->json($query->get());
    }
}
