<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'sender_id', 'receiver_id', 'content', 'type', 'attachment_path',
        'parent_id', 'read_at', 'is_starred', 'is_archived'
    ];

    public function parent()
    {
        return $this->belongsTo(Message::class, 'parent_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
