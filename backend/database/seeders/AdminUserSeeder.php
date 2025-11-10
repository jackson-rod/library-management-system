<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'admin@admin.com',
                'name' => 'Default Admin',
                'password' => Hash::make('admin123!'),
                'role' => 'Admin',
                'library_id' => 'LIB-ADMIN-0001',
            ],
        );
    }
}
