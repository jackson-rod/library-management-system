<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Book;

class BookTest extends TestCase
{
    use RefreshDatabase;

    protected function authenticateAdmin()
    {
        $admin = User::factory()->create(['role' => 'Admin']);
        $token = $admin->createToken('Admin')->plainTextToken;

        return ['Authorization' => "Bearer $token"];
    }

    public function test_admin_can_create_a_book()
    {
        $headers = $this->authenticateAdmin();

        $payload = [
            'title' => 'Clean Architecture',
            'author' => 'Robert C. Martin',
            'isbn' => '9780134494166',
            'publication_year' => 2017,
            'available' => true,
        ];

        $response = $this->postJson('/api/books', $payload, $headers);

        $response->assertStatus(201)
                 ->assertJsonFragment(['title' => 'Clean Architecture']);

        $this->assertDatabaseHas('books', ['isbn' => '9780134494166']);
    }

    public function test_admin_can_update_a_book()
    {
        $headers = $this->authenticateAdmin();
        $book = Book::factory()->create();

        $response = $this->putJson("/api/books/{$book->id}", [
            'title' => 'Refactoring Updated'
        ], $headers);

        $response->assertStatus(200)
                 ->assertJsonFragment(['title' => 'Refactoring Updated']);
    }

    public function test_admin_can_delete_a_book()
    {
        $headers = $this->authenticateAdmin();
        $book = Book::factory()->create();

        $response = $this->deleteJson("/api/books/{$book->id}", [], $headers);
        $response->assertStatus(204);

        $this->assertDatabaseMissing('books', ['id' => $book->id]);
    }

    public function test_user_cannot_create_books()
    {
        $user = User::factory()->create(['role' => 'User']);
        $token = $user->createToken('User')->plainTextToken;

        $payload = Book::factory()->make()->toArray();

        $response = $this->postJson('/api/books', $payload, [
            'Authorization' => "Bearer $token"
        ]);

        $response->assertStatus(403); // role middleware should block
    }

    public function test_anyone_can_list_books()
    {
        Book::factory()->count(3)->create();

        $response = $this->getJson('/api/books');
        $response->assertStatus(200)
         ->assertJsonCount(3, 'data');
    }

    public function test_cannot_create_book_with_duplicate_isbn()
    {
        $headers = $this->authenticateAdmin();
        $book = Book::factory()->create(['isbn' => '12345']);

        $payload = [
            'title' => 'Duplicate',
            'author' => 'John Doe',
            'isbn' => '12345',
            'publication_year' => 2020,
        ];

        $response = $this->postJson('/api/books', $payload, $headers);
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['isbn']);
    }

    public function test_show_returns_404_if_book_not_found()
    {
        $headers = $this->authenticateAdmin();
        $response = $this->getJson('/api/books/999', $headers);
        $response->assertStatus(404);
    }
}
