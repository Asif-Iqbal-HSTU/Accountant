<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'month',
        'year',
        'name',
        'hours',
        'holidays',
        'notes',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
