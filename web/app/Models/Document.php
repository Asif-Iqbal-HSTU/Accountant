<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = [
        'user_id',
        'uploaded_by_id',
        'filename',
        'filepath',
        'type',
        'category',
        'status',
        'folder_id',
        'ocr_data',
        'tags',
        'notes',
        'accountant_comment',
        'amount',
        'document_date',
        'merchant',
        'file_size',
        'mime_type',
    ];

    protected $casts = [
        'ocr_data' => 'array',
        'tags' => 'array',
        'amount' => 'decimal:2',
        'document_date' => 'date',
    ];

    /**
     * The user who owns/is associated with this document (client)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The user who uploaded this document
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    /**
     * Scope to filter by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by category
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to filter by type
     */
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }
}
