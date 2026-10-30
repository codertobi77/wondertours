<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
class Category extends Model
{
    use HasUuids;
    protected $table = 'categories';
    protected $fillable = ['name','name_en','slug','description','description_en','icon','color','sort_order','is_active'];
    protected $casts = ['is_active'=>'boolean','sort_order'=>'integer','created_at'=>'datetime','updated_at'=>'datetime'];
    public function circuits(): BelongsToMany { return $this->belongsToMany(Circuit::class, '_CategoryToCircuit', 'A', 'B'); }
}
