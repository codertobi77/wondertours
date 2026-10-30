<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Model;
class Service extends Model
{
    use HasUuids;
    protected $table = 'services';
    protected $fillable = ['title','title_en','description','description_en','icon','href','sort_order','is_active'];
    protected $casts = ['is_active'=>'boolean','sort_order'=>'integer','created_at'=>'datetime','updated_at'=>'datetime'];
}
