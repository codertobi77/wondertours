<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Destination extends Model
{
    use HasUuids;
    protected $table = 'destinations';
    protected $fillable = ['name','name_en','slug','description','description_en','image_url','country','region','coordinates_lat','coordinates_lng','is_active'];
    protected $casts = ['is_active'=>'boolean','coordinates_lat'=>'decimal:10','coordinates_lng'=>'decimal:11','created_at'=>'datetime','updated_at'=>'datetime'];
    public function circuits(): HasMany { return $this->hasMany(Circuit::class, 'destination_id'); }
}
