<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'author', 'isbn', 'publication_year', 'available'];

    protected $casts = [
        'available' => 'boolean',
    ];

    /**
     * A book can have many borrow records over time.
     */
    public function borrows(): HasMany
    {
        return $this->hasMany(Borrow::class);
    }
}
