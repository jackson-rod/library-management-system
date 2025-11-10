<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BookController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $books = Book::query()
            ->when($request->query('search'), function ($q, $term) {
                return $q->where('title', 'like', "%{$term}%")
                    ->orWhere('author', 'like', "%{$term}%")
                    ->orWhere('isbn', 'like', "%{$term}%");
            })
            ->orderBy('title')
            ->paginate(10);

        return response()->json($books);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreBookRequest $request
     * @return JsonResponse
     */
    public function store(StoreBookRequest $request): JsonResponse
    {
        $book = Book::create($request->validated());
        return response()->json(['message' => 'Book created successfully', 'book' => $book], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param Book $book
     * @return JsonResponse
     */
    public function show(Book $book): JsonResponse
    {
        return response()->json($book, 200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param UpdateBookRequest $request
     * @param Book $book
     * @return JsonResponse
     */
    public function update(UpdateBookRequest $request, Book $book): JsonResponse
    {
        $book->update($request->validated());
        return response()->json(['message' => 'Book updated successfully', 'book' => $book], 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Book $book
     * @return JsonResponse|Response
     */
    public function destroy(Book $book): JsonResponse|Response
    {
        try {
            $book->delete();
            return response()->noContent();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Unable to delete book'], 500);
        }
    }
}
