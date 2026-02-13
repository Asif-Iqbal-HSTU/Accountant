<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CorporationTax extends Model
{
    protected $table = 'corporation_tax';

    protected $fillable = [
        'user_id',
        'year',
        'ct600_file',
        'ct600_filename',
        'tax_computation_file',
        'tax_computation_filename',
        'liability_amount',
        'payment_link',
        'payment_reference',
    ];

    protected $casts = [
        'liability_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
