<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class Setting extends Model
{
    use HasUuids;
    protected $table = 'settings';
    protected $fillable = ['key','value','description'];
    protected $casts = ['updated_at'=>'datetime'];
}
