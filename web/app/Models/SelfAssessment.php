<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SelfAssessment extends Model
{
    protected $fillable = [
        'user_id',
        'tax_year',
        'tax_return_file',
        'tax_return_filename',
        'liability_amount',
        'payment_link',
        'utr_number',
    ];

    protected $casts = [
        'liability_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
