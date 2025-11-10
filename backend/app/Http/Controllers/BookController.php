<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Books",
 *     description="Book catalog management"
 * )
 *
 * @OA\Schema(
 *     schema="BookResource",
 *     required={"id","title","author","isbn","publication_year","available"},
 *     @OA\Property(property="id", type="integer", example=10),
 *     @OA\Property(property="title", type="string", example="Clean Architecture"),
 *     @OA\Property(property="author", type="string", example="Robert C. Martin"),
 *     @OA\Property(property="isbn", type="string", example="9780134494166"),
 *     @OA\Property(property="publication_year", type="integer", example=2017),
 *     @OA\Property(property="available", type="boolean", example=true)
 * )
 */
class BookController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    /**
     * @OA\Get(
     *     path="/api/books",
     *     summary="List books",
     *     tags={"Books"},
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Filter by title, author or ISBN",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/BookResource"))
     *         )
     *     )
     * )
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
    /**
     * @OA\Post(
     *     path="/api/books",
     *     summary="Create a book",
     *     tags={"Books"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"title","author","isbn","publication_year"},
     *             @OA\Property(property="title", type="string"),
     *             @OA\Property(property="author", type="string"),
     *             @OA\Property(property="isbn", type="string"),
     *             @OA\Property(property="publication_year", type="integer"),
     *             @OA\Property(property="available", type="boolean")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Book created", @OA\JsonContent(ref="#/components/schemas/BookResource")),
     *     @OA\Response(response=422, description="Validation error")
     * )
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
    /**
     * @OA\Get(
     *     path="/api/books/{id}",
     *     summary="Show a book",
     *     tags={"Books"},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Book", @OA\JsonContent(ref="#/components/schemas/BookResource")),
     *     @OA\Response(response=404, description="Not found")
     * )
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
    /**
     * @OA\Put(
     *     path="/api/books/{id}",
     *     summary="Update a book",
     *     tags={"Books"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="title", type="string"),
     *             @OA\Property(property="author", type="string"),
     *             @OA\Property(property="isbn", type="string"),
     *             @OA\Property(property="publication_year", type="integer"),
     *             @OA\Property(property="available", type="boolean")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Book updated", @OA\JsonContent(ref="#/components/schemas/BookResource"))
     * )
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
    /**
     * @OA\Delete(
     *     path="/api/books/{id}",
     *     summary="Delete a book",
     *     tags={"Books"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=204, description="Deleted"),
     *     @OA\Response(response=404, description="Not found")
     * )
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
