<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Borrow;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Borrow>
 */
class BorrowFactory extends Factory
{
    protected $model = Borrow::class;

    public function definition(): array
    {
        $borrowedAt = $this->faker->dateTimeBetween('-2 months', 'now');
        $dueDate = (clone $borrowedAt)->modify('+'.Borrow::DEFAULT_LOAN_DAYS.' days');
        $returned = $this->faker->boolean(60);
        $returnedAt = $returned ? $this->faker->dateTimeBetween($borrowedAt, 'now') : null;

        return [
            'user_id' => User::factory(),
            'book_id' => Book::factory(),
            'borrowed_at' => $borrowedAt,
            'due_date' => $dueDate,
            'returned_at' => $returnedAt,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Borrow $borrow) {
            if (is_null($borrow->returned_at)) {
                $borrow->book()->update(['available' => false]);
            }
        });
    }
}
