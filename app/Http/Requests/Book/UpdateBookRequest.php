<?php

namespace App\Http\Requests\Book;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Route;
use App\Models\Book;

class UpdateBookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
{
    $bookParameter = Route::current()?->parameter('book');
    $bookId = $bookParameter instanceof Book ? $bookParameter->getKey() : $bookParameter;

    return [
        'title' => 'sometimes|string|max:255',
        'author' => 'sometimes|string|max:255',
        'isbn' => 'sometimes|string|unique:books,isbn,' . $bookId,
        'publication_year' => 'sometimes|integer|digits:4|min:' . (date('Y') - 100) . '|max:' . date('Y'),
        'available' => 'sometimes|boolean',
    ];
}
}
