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

        $query = Message::with('parent')->where(function ($q) use ($authUserId, $userId) {
            $q->where(function ($sub) use ($authUserId, $userId) {
                $sub->where('sender_id', $authUserId)->where('receiver_id', $userId);
            })->orWhere(function ($sub) use ($authUserId, $userId) {
                $sub->where('sender_id', $userId)->where('receiver_id', $authUserId);
            });
        });

        // Search
        if ($request->has('q') && !empty($request->q)) {
            $query->where('content', 'like', '%' . $request->q . '%');
        }

        // Date range filtering
        if ($request->has('date_from') && !empty($request->date_from)) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && !empty($request->date_to)) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Archive logic: By default, hide archived messages unless specifically requested
        if ($request->has('archived') && $request->archived == 'true') {
            $query->where('is_archived', true);
        } else {
            $query->where('is_archived', false);
        }

        $messages = $query->orderBy('created_at', 'asc')->get();

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240',
            'type' => 'required|in:text,image,file,audio',
            'parent_id' => 'nullable|exists:messages,id'
        ]);

        $path = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = $file->getClientOriginalName();
            $folder = 'attachments/' . \Illuminate\Support\Str::uuid();
            $path = $file->storeAs($folder, $filename, 'public');
        }

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'content' => $request->content,
            'type' => $request->type,
            'attachment_path' => $path ? '/storage/' . $path : null,
            'parent_id' => $request->parent_id
        ]);

        return response()->json($message->load('parent'));
    }

    public function markAsRead($id)
    {
        $message = Message::where('id', $id)->where('receiver_id', Auth::id())->firstOrFail();
        $message->update(['read_at' => now()]);
        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllRead($senderId)
    {
        Message::where('sender_id', $senderId)
            ->where('receiver_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json(['message' => 'All marked as read']);
    }

    public function toggleStar($id)
    {
        // Allow sender or receiver to star? Usually purely personal. 
        // For simple shared chat, starring affects visualization. 
        // If it's a shared db row, both see it starred.
        $message = Message::findOrFail($id);
        
        // Simple authorization check
        if ($message->sender_id !== Auth::id() && $message->receiver_id !== Auth::id()) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message->is_starred = !$message->is_starred;
        $message->save();
        
        return response()->json($message);
    }

    public function archiveConversation(Request $request, $userId)
    {
        // In a real app, archiving is usually a user-specific pivot state (user_conversations table).
        // Since we are using a single messages table, setting is_archived = true hides it for BOTH.
        // This might not be ideal but fits requested requirement "Archive old conversations" within current schema.
        // Better: Update only where (sender=auth, receiver=user) OR (sender=user, receiver=auth).
        
        $authUserId = Auth::id();
        Message::where(function($q) use ($authUserId, $userId) {
             $q->where('sender_id', $authUserId)->where('receiver_id', $userId);
        })->orWhere(function($q) use ($authUserId, $userId) {
             $q->where('sender_id', $userId)->where('receiver_id', $authUserId);
        })->update(['is_archived' => true]);

        return response()->json(['message' => 'Conversation archived']);
    }

    /**
     * Set typing status (stored in cache for 5 seconds)
     */
    public function setTyping(Request $request, $receiverId)
    {
        $cacheKey = 'typing_' . Auth::id() . '_' . $receiverId;
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->addSeconds(5));
        return response()->json(['status' => 'ok']);
    }

    /**
     * Check if partner is typing
     */
    public function getTyping($partnerId)
    {
        $cacheKey = 'typing_' . $partnerId . '_' . Auth::id();
        $isTyping = \Illuminate\Support\Facades\Cache::get($cacheKey, false);
        return response()->json(['is_typing' => $isTyping]);
    }
}
