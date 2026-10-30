<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class BlogPost extends Model
{
    use HasUuids;
    protected $table = 'blog_posts';
    protected $fillable = ['slug','title','title_en','excerpt','excerpt_en','content','content_en','category_id','author_id','image_url','gallery','tags','read_time','views','is_featured','is_published','published_at'];
    protected $casts = ['gallery'=>'array','tags'=>'array','read_time'=>'integer','views'=>'integer','is_featured'=>'boolean','is_published'=>'boolean','published_at'=>'datetime','created_at'=>'datetime','updated_at'=>'datetime'];
    public function category(): BelongsTo { return $this->belongsTo(BlogCategory::class, 'category_id'); }
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'author_id'); }
}
