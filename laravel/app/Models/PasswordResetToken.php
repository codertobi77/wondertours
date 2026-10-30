<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class PasswordResetToken extends Model
{
    use HasUuids;
    protected $table = 'password_reset_tokens';
    protected $fillable = ['user_id','token_hash','expires_at','used_at'];
    protected $casts = ['expires_at'=>'datetime','used_at'=>'datetime','created_at'=>'datetime'];
    public function user(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
}
