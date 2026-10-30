<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory, HasUuids;
    protected $table = 'users';
    protected $fillable = ['email', 'password_hash', 'first_name', 'last_name', 'role', 'is_active', 'last_login_at'];
    protected $hidden = ['password_hash'];
    protected $casts = ['is_active' => 'boolean', 'created_at' => 'datetime', 'updated_at' => 'datetime', 'last_login_at' => 'datetime'];
    public function getAuthPassword() { return $this->password_hash; }
    public function circuits(): HasMany { return $this->hasMany(Circuit::class, 'created_by'); }
    public function blogPosts(): HasMany { return $this->hasMany(BlogPost::class, 'author_id'); }
    public function mediaFiles(): HasMany { return $this->hasMany(MediaFile::class, 'uploaded_by'); }
    public function passwordResetTokens(): HasMany { return $this->hasMany(PasswordResetToken::class, 'user_id'); }
}
