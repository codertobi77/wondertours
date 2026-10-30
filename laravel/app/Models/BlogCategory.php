<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class BlogCategory extends Model
{
    use HasUuids;
    protected $table = 'blog_categories';
    protected $fillable = ['name','name_en','slug','description','description_en','color','sort_order','is_active'];
    protected $casts = ['is_active'=>'boolean','sort_order'=>'integer','created_at'=>'datetime','updated_at'=>'datetime'];
    public function posts(): HasMany { return $this->hasMany(BlogPost::class, 'category_id'); }
}
