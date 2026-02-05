<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'client_id',
        'accountant_id',
        'title',
        'agenda',
        'type',
        'urgency',
        'status',
        'proposed_slots',
        'confirmed_at',
        'duration_minutes',
        'meeting_link',
        'location',
        'cancellation_reason',
        'latest_negotiation_note',
    ];

    protected $casts = [
        'proposed_slots' => 'array',
        'confirmed_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function accountant()
    {
        return $this->belongsTo(User::class, 'accountant_id');
    }
}
