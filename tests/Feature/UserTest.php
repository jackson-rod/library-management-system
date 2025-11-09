<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected function authenticateAdmin()
    {
        $admin = User::factory()->create(['role' => 'Admin']);
        $token = $admin->createToken('Admin')->plainTextToken;

        return ['Authorization' => "Bearer $token"];
    }

    public function test_admin_can_create_user()
    {
        $headers = $this->authenticateAdmin();

        $payload = [
            'name' => 'Laura Sánchez',
            'email' => 'laura@example.com',
            'password' => 'password123',
            'role' => 'User',
            'library_id' => 'LIB-1001',
        ];

        $response = $this->postJson('/api/users', $payload, $headers);

        $response->assertStatus(201)
                 ->assertJsonFragment(['email' => 'laura@example.com']);

        $this->assertDatabaseHas('users', ['email' => 'laura@example.com']);
    }

    public function test_admin_can_update_user()
    {
        $headers = $this->authenticateAdmin();
        $user = User::factory()->create();

        $response = $this->putJson("/api/users/{$user->id}", [
            'role' => 'Admin',
        ], $headers);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'Admin',
        ]);
    }

    public function test_admin_can_list_users()
    {
        $headers = $this->authenticateAdmin();
        User::factory()->count(3)->create();

        $response = $this->getJson('/api/users', $headers);
        $response->assertStatus(200)
                ->assertJsonCount(4, 'data');
    }

    public function test_admin_can_view_single_user()
    {
        $headers = $this->authenticateAdmin();
        $user = User::factory()->create();

        $response = $this->getJson("/api/users/{$user->id}", $headers);
        $response->assertStatus(200)
                ->assertJsonFragment(['id' => $user->id]);
    }

    public function test_admin_can_delete_user()
    {
        $headers = $this->authenticateAdmin();
        $user = User::factory()->create();

        $response = $this->deleteJson("/api/users/{$user->id}", [], $headers);
        $response->assertStatus(204);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_non_admin_cannot_manage_users()
    {
        $user = User::factory()->create(['role' => 'User']);
        $token = $user->createToken('User')->plainTextToken;

        $payload = User::factory()->make()->toArray();

        $response = $this->postJson('/api/users', $payload, [
            'Authorization' => "Bearer $token"
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_create_user_with_existing_email()
    {
        $headers = $this->authenticateAdmin();
        $existing = User::factory()->create(['email' => 'taken@example.com']);

        $payload = [
            'name' => 'Test User',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'role' => 'User',
            'library_id' => 'LIB-9999',
        ];

        $response = $this->postJson('/api/users', $payload, $headers);
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    public function test_show_returns_404_if_user_not_found()
    {
        $headers = $this->authenticateAdmin();
        $response = $this->getJson('/api/users/999', $headers);
        $response->assertStatus(404);
    }
}
