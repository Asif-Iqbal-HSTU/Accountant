<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'firm_name',
        'occupation',
        'phone',
        'device_token',
        'setup_completed',
        'bio',
        'profile_photo',
        'subscription_status',
        'subscription_expires_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'services_config',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function services()
    {
        return $this->hasMany(ClientService::class);
    }

    protected function servicesConfig(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: function () {
                $defaults = [
                    'payroll' => false,
                    'accounts' => false,
                    'corporation_tax' => false,
                    'vat' => false,
                    'self_assessment' => false,
                ];

                // Eager load services if relation loaded, or fetch if needed (though accessing attribute usually implies need)
                // However, since this is an appended attribute, we should be careful about N+1.
                // For simplicity now, we iterate over the loaded relation if available.

                $userServices = $this->services; 

                $config = [];
                foreach ($userServices as $service) {
                    $config[$service->service] = $service->is_active;
                }
                
                return array_merge($defaults, $config);
            },
        );
    }
    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function companyInfo()
    {
        return $this->hasOne(ClientCompanyInfo::class);
    }
}
