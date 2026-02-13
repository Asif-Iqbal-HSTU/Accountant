<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class P60P45 extends Model
{
    protected $table = 'p60s_p45s';

    protected $fillable = [
        'user_id',
        'tax_year',
        'type',
        'file_path',
        'filename',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
