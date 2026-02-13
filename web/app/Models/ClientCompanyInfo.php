<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientCompanyInfo extends Model
{
    protected $table = 'client_company_info';

    protected $fillable = [
        'user_id',
        'company_number',
        'auth_code',
        'incorporation_certificate',
        'ct_reference',
        'vat_registration',
        'paye_registration',
        'accounts_office_ref',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
