<?php

namespace Database\Seeders;

use App\Models\Borrow;
use Illuminate\Database\Seeder;

class BorrowSeeder extends Seeder
{
    /**
     * Seed a few borrow records to showcase the workflow.
     */
    public function run(): void
    {
        Borrow::factory()->count(5)->create();
    }
}
