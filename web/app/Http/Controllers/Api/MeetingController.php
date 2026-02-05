<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MeetingController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Meeting::query();

        // Assuming 'role' or similar distinguishes accountant vs client
        // Based on previous conv, users have roles.
        // Assuming user() returns the logged in user.
        
        // Check if role column exists or how to identify. 
        // Based on migrations: 2026_01_27_190531_add_role_to_users_table.php
        
        if ($user->role === 'accountant') {
            $query->where('accountant_id', $user->id);
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }
        } else {
            $query->where('client_id', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->with(['client:id,name,email', 'accountant:id,name,email'])->latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string',
            'agenda' => 'nullable|string',
            'type' => 'required|in:phone,video,in_person,quick_check_in',
            'urgency' => 'in:low,medium,high,urgent',
            'proposed_slots' => 'required|array|min:1',
            'accountant_id' => 'required|exists:users,id',
        ]);

        $meeting = Meeting::create([
            'client_id' => Auth::id(),
            'accountant_id' => $request->accountant_id,
            'title' => $request->title ?? 'Meeting Request',
            'agenda' => $request->agenda,
            'type' => $request->type,
            'urgency' => $request->urgency ?? 'medium',
            'proposed_slots' => $request->proposed_slots,
            'status' => 'pending_accountant',
        ]);

        return response()->json($meeting, 201);
    }

    public function show($id)
    {
        $meeting = Meeting::with(['client', 'accountant'])->findOrFail($id);
        $this->authorizeAccess($meeting);
        return response()->json($meeting);
    }

    public function update(Request $request, $id)
    {
        $meeting = Meeting::findOrFail($id);
        $this->authorizeAccess($meeting);
        
        // Basic validation
        $request->validate([
            'status' => 'sometimes|in:pending_accountant,pending_client,confirmed,declined,cancelled',
            'confirmed_at' => 'sometimes|date',
            'cancellation_reason' => 'nullable|string',
            'meeting_link' => 'nullable|string',
            'proposed_slots' => 'sometimes|array',
            'latest_negotiation_note' => 'nullable|string',
        ]);

        // Logic for confirmation
        if ($request->has('status') && $request->status === 'confirmed') {
            if (!$meeting->confirmed_at && !$request->confirmed_at) {
                return response()->json(['error' => 'confirmed_at is required when confirming'], 422);
            }
            
            // Auto-generate link if video and not provided
            if ($meeting->type === 'video' && !$request->meeting_link && !$meeting->meeting_link) {
                 // Placeholder for auto-generation
                 $meeting->meeting_link = 'https://meet.google.com/placeholder-link'; 
            }
        }

        // Handle counter-proposal flow implicitly via status change + slots update
        // If status is flipping between pending_accountant <-> pending_client
        if ($request->has('status') && in_array($request->status, ['pending_accountant', 'pending_client'])) {
            // Ensure slots are provided if it's a counter proposal (optional enforcement)
            if ($meeting->status !== $request->status && $request->has('proposed_slots')) {
                 // It is a counter proposal
            }
        }

        $meeting->update($request->all());

        return response()->json($meeting);
    }

    private function authorizeAccess($meeting) {
        $user = Auth::user();
        if ($meeting->client_id !== $user->id && $meeting->accountant_id !== $user->id) {
             abort(403, 'Unauthorized');
        }
    }
}
