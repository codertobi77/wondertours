<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model as EloquentModel;
use Illuminate\Support\Str;

class Model extends EloquentModel
{
    /**
     * Sérialise les attributs en camelCase pour correspondre au contrat
     * de l'API PHP (Serial.php) consommé par le frontend Next.js.
     */
    public function attributesToArray(): array
    {
        $attrs = parent::attributesToArray();
        $out = [];
        foreach ($attrs as $key => $value) {
            $out[Str::camel($key)] = $value;
        }
        return $out;
    }

    /**
     * Sérialise les relations en camelCase (clés des objets imbriqués).
     */
    public function toArray(): array
    {
        $array = parent::toArray();
        // Les relations sont déjà converties via attributesToArray des modèles liés,
        // mais les clés de premier niveau (relations) restent en snake_case.
        $out = [];
        foreach ($array as $key => $value) {
            if ($key === 'pivot') {
                continue;
            }
            $out[Str::camel($key)] = is_array($value) ? $this->convertNested($value) : $value;
        }
        return $out;
    }

    private function convertNested($value)
    {
        if (is_array($value) && array_is_list($value)) {
            $out = [];
            foreach ($value as $item) {
                if (is_array($item)) {
                    $row = [];
                    foreach ($item as $k => $v) {
                        if ($k === 'pivot') continue;
                        $row[Str::camel($k)] = is_array($v) ? $this->convertNested($v) : $v;
                    }
                    $out[] = $row;
                } else {
                    $out[] = $item;
                }
            }
            return $out;
        }
        if (is_array($value)) {
            $out = [];
            foreach ($value as $k => $v) {
                if ($k === 'pivot') continue;
                $out[Str::camel($k)] = is_array($v) ? $this->convertNested($v) : $v;
            }
            return $out;
        }
        return $value;
    }
}
