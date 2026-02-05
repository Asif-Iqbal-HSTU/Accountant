<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * List all documents for a user (for clients viewing their own, or accountants viewing client's)
     */
    public function index(Request $request, $userId = null)
    {
        $authUser = Auth::user();
        
        // If no userId specified, show current user's documents
        $targetUserId = $userId ?? $authUser->id;
        
        // Authorization: clients can only see their own, accountants can see their clients'
        if ($authUser->role !== 'accountant' && $authUser->id != $targetUserId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = Document::where('user_id', $targetUserId);

        // Filter by status
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category') && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        // Filter by type
        if ($request->has('type') && !empty($request->type)) {
            $query->where('type', $request->type);
        }

        // Search by filename or merchant
        if ($request->has('q') && !empty($request->q)) {
            $query->where(function ($q) use ($request) {
                $q->where('filename', 'like', '%' . $request->q . '%')
                  ->orWhere('merchant', 'like', '%' . $request->q . '%')
                  ->orWhere('notes', 'like', '%' . $request->q . '%');
            });
        }

        // Date range filter
        if ($request->has('date_from') && !empty($request->date_from)) {
            $query->whereDate('document_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && !empty($request->date_to)) {
            $query->whereDate('document_date', '<=', $request->date_to);
        }

        $documents = $query->orderBy('created_at', 'desc')->get();

        return response()->json($documents);
    }

    /**
     * Get a single document
     */
    public function show($id)
    {
        $document = Document::findOrFail($id);
        $authUser = Auth::user();

        // Authorization check
        if ($authUser->role !== 'accountant' && $document->user_id !== $authUser->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($document);
    }

    /**
     * Upload a new document (single or bulk)
     */
    public function store(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|max:20480', // 20MB max per file
            'user_id' => 'nullable|exists:users,id', // For accountants uploading to client
            'type' => 'nullable|string',
            'category' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $authUser = Auth::user();
        $targetUserId = $request->user_id ?? $authUser->id;

        // Authorization: only accountants can upload to other users
        if ($authUser->role !== 'accountant' && $targetUserId != $authUser->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $uploadedDocuments = [];

        foreach ($request->file('files') as $file) {
            $originalName = $file->getClientOriginalName();
            $folder = 'documents/' . Str::uuid();
            $path = $file->storeAs($folder, $originalName, 'public');

            // Determine type based on mime type
            $mimeType = $file->getMimeType();
            $type = $request->type ?? 'file';
            if (str_starts_with($mimeType, 'image/')) {
                $type = $request->type ?? 'image';
            }

            $document = Document::create([
                'user_id' => $targetUserId,
                'uploaded_by_id' => $authUser->id,
                'filename' => $originalName,
                'filepath' => '/storage/' . $path,
                'type' => $type,
                'category' => $request->category,
                'status' => 'pending',
                'notes' => $request->notes,
                'file_size' => $file->getSize(),
                'mime_type' => $mimeType,
            ]);

            $uploadedDocuments[] = $document;
        }

        return response()->json([
            'message' => count($uploadedDocuments) . ' document(s) uploaded successfully',
            'documents' => $uploadedDocuments
        ]);
    }

    /**
     * Update document metadata
     */
    public function update(Request $request, $id)
    {
        $document = Document::findOrFail($id);
        $authUser = Auth::user();

        // Only accountants can update, or owner can update their own notes
        if ($authUser->role !== 'accountant' && $document->user_id !== $authUser->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validData = $request->validate([
            'type' => 'nullable|string',
            'category' => 'nullable|string',
            'status' => 'nullable|in:pending,reviewed,processed',
            'notes' => 'nullable|string',
            'accountant_comment' => 'nullable|string',
            'amount' => 'nullable|numeric',
            'document_date' => 'nullable|date',
            'merchant' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        // Clients can only update certain fields
        if ($authUser->role !== 'accountant') {
            $validData = array_intersect_key($validData, array_flip(['notes', 'tags']));
        }

        $document->update($validData);

        return response()->json($document);
    }

    /**
     * Delete a document
     */
    public function destroy($id)
    {
        $document = Document::findOrFail($id);
        $authUser = Auth::user();

        // Only owner or accountant can delete
        if ($authUser->role !== 'accountant' && $document->user_id !== $authUser->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete file from storage
        $storagePath = str_replace('/storage/', '', $document->filepath);
        Storage::disk('public')->delete($storagePath);

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }

    /**
     * Update document status (for accountants)
     */
    public function updateStatus(Request $request, $id)
    {
        $document = Document::findOrFail($id);
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can update document status'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,reviewed,processed',
            'accountant_comment' => 'nullable|string',
        ]);

        $document->update([
            'status' => $request->status,
            'accountant_comment' => $request->accountant_comment ?? $document->accountant_comment,
        ]);

        return response()->json($document);
    }

    /**
     * Request resubmission (for accountants)
     */
    public function requestResubmission(Request $request, $id)
    {
        $document = Document::findOrFail($id);
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can request resubmission'], 403);
        }

        $request->validate([
            'reason' => 'required|string',
        ]);

        $document->update([
            'status' => 'pending',
            'accountant_comment' => 'Resubmission requested: ' . $request->reason,
        ]);

        return response()->json([
            'message' => 'Resubmission requested',
            'document' => $document
        ]);
    }

    /**
     * Get document statistics for a user
     */
    public function stats($userId = null)
    {
        $authUser = Auth::user();
        $targetUserId = $userId ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $targetUserId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $stats = [
            'total' => Document::where('user_id', $targetUserId)->count(),
            'pending' => Document::where('user_id', $targetUserId)->where('status', 'pending')->count(),
            'reviewed' => Document::where('user_id', $targetUserId)->where('status', 'reviewed')->count(),
            'processed' => Document::where('user_id', $targetUserId)->where('status', 'processed')->count(),
            'approved' => Document::where('user_id', $targetUserId)->where('status', 'processed')->count(), // Alias for mobile app
            'by_category' => Document::where('user_id', $targetUserId)
                ->selectRaw('category, count(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category'),
            'by_type' => Document::where('user_id', $targetUserId)
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
        ];

        return response()->json($stats);
    }
}
