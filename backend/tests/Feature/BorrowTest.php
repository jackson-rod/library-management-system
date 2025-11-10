<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Borrow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BorrowTest extends TestCase
{
    use RefreshDatabase;

    protected function authenticate(User $user): array
    {
        $token = $user->createToken('TestToken')->plainTextToken;

        return ['Authorization' => "Bearer $token"];
    }

    public function test_user_can_borrow_an_available_book(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['available' => true]);

        $response = $this
            ->withHeaders($this->authenticate($user))
            ->postJson('/api/borrowings', ['book_id' => $book->id]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.book.id', $book->id);

        $this->assertDatabaseHas('borrows', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'returned_at' => null,
        ]);

        $this->assertFalse($book->fresh()->available);
    }

    public function test_user_cannot_borrow_unavailable_book(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['available' => false]);

        $response = $this
            ->withHeaders($this->authenticate($user))
            ->postJson('/api/borrowings', ['book_id' => $book->id]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'This book is currently unavailable.']);
    }

    public function test_user_cannot_exceed_borrow_limit(): void
    {
        $user = User::factory()->create();
        $books = Book::factory()->count(Borrow::MAX_ACTIVE_BORROWS)->create(['available' => false]);

        foreach ($books as $book) {
            Borrow::factory()
                ->for($user)
                ->for($book)
                ->state([
                    'borrowed_at' => now()->subDays(3),
                    'due_date' => now()->addDays(10),
                    'returned_at' => null,
                ])
                ->create();
        }

        $extraBook = Book::factory()->create(['available' => true]);

        $response = $this
            ->withHeaders($this->authenticate($user))
            ->postJson('/api/borrowings', ['book_id' => $extraBook->id]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Borrowing limit reached. Return a book before borrowing a new one (limit: 3).']);
    }

    public function test_user_can_view_their_borrowings(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['available' => false]);
        Borrow::factory()->for($user)->for($book)->state(['returned_at' => null])->create();

        Borrow::factory()->create(); // another user

        $response = $this
            ->withHeaders($this->authenticate($user))
            ->getJson('/api/me/borrowings');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.book.id', $book->id);
    }

    public function test_user_can_return_borrowed_book(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['available' => false]);
        $borrow = Borrow::factory()->for($user)->for($book)->state(['returned_at' => null])->create();

        $response = $this
            ->withHeaders($this->authenticate($user))
            ->postJson("/api/borrowings/{$borrow->id}/return");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'returned');

        $this->assertNotNull($borrow->fresh()->returned_at);
        $this->assertTrue($book->fresh()->available);
    }

    public function test_user_cannot_return_other_users_borrow(): void
    {
        $user = User::factory()->create();
        $borrow = Borrow::factory()->state(['returned_at' => null])->create();

        $response = $this
            ->withHeaders($this->authenticate($user))
            ->postJson("/api/borrowings/{$borrow->id}/return");

        $response->assertStatus(403);
    }

    public function test_admin_can_list_all_borrowings(): void
    {
        $admin = User::factory()->create(['role' => 'Admin']);
        Borrow::factory()->count(2)->create();

        $response = $this
            ->withHeaders($this->authenticate($admin))
            ->getJson('/api/borrowings');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
