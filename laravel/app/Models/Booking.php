<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Booking extends Model
{
    use HasUuids;
    protected $table = 'bookings';
    protected $fillable = ['booking_reference','type','circuit_id','customer_name','customer_email','customer_phone','travel_date','return_date','participants','total_price','currency','status','notes'];
    protected $casts = ['total_price'=>'decimal:2','participants'=>'integer','travel_date'=>'date','return_date'=>'date','created_at'=>'datetime','updated_at'=>'datetime'];
    public function circuit(): BelongsTo { return $this->belongsTo(Circuit::class, 'circuit_id'); }
}
