<?php

namespace App\Http\Controllers;

use App\Http\Requests\Borrow\StoreBorrowRequest;
use App\Http\Resources\BorrowResource;
use App\Models\Book;
use App\Models\Borrow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class BorrowController extends Controller
{
    /**
     * List borrow records (admin only via routes).
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');

        $borrows = Borrow::query()
            ->with(['book', 'user'])
            ->when($status === 'active', fn ($query) => $query->active())
            ->orderByDesc('borrowed_at')
            ->paginate(15);

        return BorrowResource::collection($borrows)->response();
    }

    /**
     * Borrow a book for the authenticated user.
     */
    public function store(StoreBorrowRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $book = Book::findOrFail($data['book_id']);

        if (! $book->available) {
            return response()->json([
                'message' => 'This book is currently unavailable.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $activeBorrowCount = $user->borrows()->active()->count();
        if ($activeBorrowCount >= Borrow::MAX_ACTIVE_BORROWS) {
            return response()->json([
                'message' => sprintf(
                    'Borrowing limit reached. Return a book before borrowing a new one (limit: %d).',
                    Borrow::MAX_ACTIVE_BORROWS
                ),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $borrow = DB::transaction(function () use ($user, $book) {
            $borrow = Borrow::create([
                'user_id' => $user->id,
                'book_id' => $book->id,
                'borrowed_at' => now(),
                'due_date' => now()->addDays(Borrow::DEFAULT_LOAN_DAYS),
            ]);

            $book->update(['available' => false]);

            return $borrow->load('book');
        });

        return (new BorrowResource($borrow))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Borrow history for the authenticated user.
     */
    public function myBorrowings(Request $request): JsonResponse
    {
        $status = $request->query('status', 'active');

        $borrows = $request->user()
            ->borrows()
            ->with('book')
            ->when($status === 'active', fn ($query) => $query->active())
            ->orderByDesc('borrowed_at')
            ->get();

        return BorrowResource::collection($borrows)->response();
    }

    /**
     * Return a borrowed book (owner or admin).
     */
    public function returnBook(Borrow $borrow, Request $request): JsonResponse
    {
        if ($borrow->returned_at) {
            return response()->json([
                'message' => 'This borrow record is already closed.',
            ], Response::HTTP_CONFLICT);
        }

        $user = $request->user();
        if ($user->id !== $borrow->user_id && $user->role !== 'Admin') {
            return response()->json([
                'message' => 'You are not authorized to return this book.',
            ], Response::HTTP_FORBIDDEN);
        }

        $borrow = DB::transaction(function () use ($borrow) {
            $borrow->update(['returned_at' => now()]);
            $borrow->book()->update(['available' => true]);

            return $borrow->fresh(['book', 'user']);
        });

        return (new BorrowResource($borrow))->response();
    }
}
