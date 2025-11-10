<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dueDate = $this->due_date;
        $returnedAt = $this->returned_at;
        $isOverdue = is_null($returnedAt) && $dueDate && $dueDate->isPast();

        return [
            'id' => $this->id,
            'borrowed_at' => optional($this->borrowed_at)->toIso8601String(),
            'due_date' => optional($dueDate)->toIso8601String(),
            'returned_at' => optional($returnedAt)->toIso8601String(),
            'status' => $returnedAt
                ? 'returned'
                : ($isOverdue ? 'overdue' : 'active'),
            'is_overdue' => $isOverdue,
            'days_overdue' => $isOverdue ? now()->diffInDays($dueDate) : 0,
            'book' => $this->whenLoaded('book', function () {
                return [
                    'id' => $this->book->id,
                    'title' => $this->book->title,
                    'author' => $this->book->author,
                    'isbn' => $this->book->isbn,
                    'publication_year' => $this->book->publication_year,
                    'available' => (bool) $this->book->available,
                ];
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'library_id' => $this->user->library_id,
                    'role' => $this->user->role,
                ];
            }),
        ];
    }
}
