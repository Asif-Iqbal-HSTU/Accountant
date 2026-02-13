<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Account extends Model
{
    protected $fillable = [
        'user_id',
        'year',
        'file_path',
        'filename',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
