<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientService extends Model
{
    protected $fillable = [
        'user_id',
        'service',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
