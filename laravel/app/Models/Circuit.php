<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Circuit extends Model
{
    use HasUuids;
    protected $table = 'circuits';
    protected $fillable = ['slug','title','title_en','subtitle','subtitle_en','description','description_en','destination_id','duration_days','duration_nights','price','currency','image_url','gallery','highlights','highlights_en','itinerary','itinerary_en','included','included_en','excluded','excluded_en','difficulty','min_participants','max_participants','is_featured','is_active','created_by'];
    protected $casts = ['price'=>'decimal:2','is_featured'=>'boolean','is_active'=>'boolean','gallery'=>'array','highlights'=>'array','highlights_en'=>'array','itinerary'=>'array','itinerary_en'=>'array','included'=>'array','included_en'=>'array','excluded'=>'array','excluded_en'=>'array','duration_days'=>'integer','duration_nights'=>'integer','min_participants'=>'integer','max_participants'=>'integer','created_at'=>'datetime','updated_at'=>'datetime'];
    public function destination(): BelongsTo { return $this->belongsTo(Destination::class, 'destination_id'); }
    public function categories(): BelongsToMany { return $this->belongsToMany(Category::class, '_CategoryToCircuit', 'B', 'A'); }
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function testimonials(): HasMany { return $this->hasMany(Testimonial::class, 'circuit_id'); }
    public function bookings(): HasMany { return $this->hasMany(Booking::class, 'circuit_id'); }
}
