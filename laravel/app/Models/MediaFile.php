<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class MediaFile extends Model
{
    use HasUuids;
    protected $table = 'media_library';
    protected $fillable = ['filename','storage_path','url','mime_type','size','width','height','alt_text','alt_text_en','uploaded_by'];
    protected $casts = ['size'=>'integer','width'=>'integer','height'=>'integer','created_at'=>'datetime'];
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploaded_by'); }
}
