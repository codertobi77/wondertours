<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Testimonial extends Model
{
    use HasUuids;
    protected $table = 'testimonials';
    protected $fillable = ['name','country','rating','text','text_en','circuit_id','avatar_url','date','is_verified','is_featured','is_active'];
    protected $casts = ['rating'=>'integer','is_verified'=>'boolean','is_featured'=>'boolean','is_active'=>'boolean','date'=>'date','created_at'=>'datetime','updated_at'=>'datetime'];
    public function circuit(): BelongsTo { return $this->belongsTo(Circuit::class, 'circuit_id'); }
}
