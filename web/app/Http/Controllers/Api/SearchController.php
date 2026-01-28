<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function searchAccountants(Request $request)
    {
        $query = User::where('role', 'accountant');

        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        return response()->json($query->get());
    }

    public function searchClients(Request $request)
    {
        $query = User::where('role', 'client');

        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        return response()->json($query->get());
    }
}
