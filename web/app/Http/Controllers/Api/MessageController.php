<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function index(Request $request, $userId)
    {
        $authUserId = Auth::id();

        // Get messages between auth user and $userId
        $messages = Message::where(function ($q) use ($authUserId, $userId) {
            $q->where('sender_id', $authUserId)->where('receiver_id', $userId);
        })->orWhere(function ($q) use ($authUserId, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $authUserId);
        })->orderBy('created_at', 'asc')->get();

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240', // 10MB max
            'type' => 'required|in:text,image,file,audio',
        ]);

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('attachments', 'public');
        }

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'content' => $request->content,
            'type' => $request->type,
            'attachment_path' => $path ? '/storage/' . $path : null,
        ]);

        return response()->json($message);
    }
}
