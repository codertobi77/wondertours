<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class ContactRequest extends Model
{
    use HasUuids;
    protected $table = 'contact_requests';
    protected $fillable = ['name','email','phone','subject','request_type','travel_date','travelers','message','status'];
    protected $casts = ['travelers'=>'integer','travel_date'=>'date','created_at'=>'datetime','updated_at'=>'datetime'];
}
