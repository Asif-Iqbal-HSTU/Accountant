<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VatRecord extends Model
{
    protected $fillable = [
        'user_id',
        'year',
        'quarter',
        'vat_return_file',
        'vat_return_filename',
        'liability_amount',
        'payment_link',
        'payment_reference',
    ];

    protected $casts = [
        'liability_amount' => 'decimal:2',
        'quarter' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
