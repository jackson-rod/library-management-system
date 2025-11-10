<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Auth",
 *     description="Authentication and session management"
 * )
 *
 * @OA\Schema(
 *     schema="UserResource",
 *     required={"id","name","email","role"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Default Admin"),
 *     @OA\Property(property="email", type="string", example="admin@example.com"),
 *     @OA\Property(property="role", type="string", example="Admin"),
 *     @OA\Property(property="library_id", type="string", nullable=true, example="LIB-1001")
 * )
 *
 * @OA\Schema(
 *     schema="AuthResponse",
 *     required={"user","token"},
 *     @OA\Property(property="user", ref="#/components/schemas/UserResource"),
 *     @OA\Property(property="token", type="string", example="1|abcd1234")
 * )
 */
class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/register",
     *     summary="Register a new user",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","password"},
     *             @OA\Property(property="name", type="string", example="Jane Doe"),
     *             @OA\Property(property="email", type="string", example="jane@example.com"),
     *             @OA\Property(property="password", type="string", example="password123"),
     *             @OA\Property(property="role", type="string", example="User")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="User registered",
     *         @OA\JsonContent(ref="#/components/schemas/AuthResponse")
     *     ),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'sometimes|string|in:Admin,User',
            'library_id' => 'nullable|string|max:255',
            'password' => 'required|string|min:8',
        ]);

        $fields['role'] = $fields['role'] ?? 'User';

        $fields['library_id'] = $this->generateLibraryId();

        $user = User::create($fields);
        $token = $user->createToken($user->name);

        $response = [
            'user' => $user,
            'token' => $token->plainTextToken
        ];

        return response($response, 201);
    }

    /**
     * Generate a unique library ID in the format LIB-####
     * Uses a combination of random numbers to ensure uniqueness
     */
    private function generateLibraryId(): string
    {
        $maxAttempts = 100;
        $attempts = 0;

        do {
            $number = rand(1000, 9999);
            $libraryId = 'LIB-' . str_pad((string) $number, 4, '0', STR_PAD_LEFT);
            $attempts++;

            if ($attempts >= $maxAttempts) {
                $timestamp = time();
                $randomSuffix = rand(100, 999);
                $fallbackNumber = substr($timestamp . $randomSuffix, -4);
                $libraryId = 'LIB-' . str_pad($fallbackNumber, 4, '0', STR_PAD_LEFT);
                if (User::where('library_id', $libraryId)->exists()) {
                    $libraryId = 'LIB-' . str_pad(substr($timestamp, -3), 3, '0', STR_PAD_LEFT) . chr(65 + rand(0, 25));
                }
                break;
            }
        } while (User::where('library_id', $libraryId)->exists());

        return $libraryId;
    }

    /**
     * @OA\Post(
     *     path="/api/login",
     *     summary="Authenticate a user",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", example="admin@admin.com"),
     *             @OA\Property(property="password", type="string", example="admin123!")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Authenticated",
     *         @OA\JsonContent(ref="#/components/schemas/AuthResponse")
     *     ),
     *     @OA\Response(response=401, description="Invalid credentials")
     * )
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if(!$user || !Hash::check($request->password, $user->password)) {
            return response([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $user->createToken($user->name);

        $response = [
            'user' => $user,
            'token' => $token->plainTextToken
        ];

        return response($response, 200);
    }

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     summary="Logout the current user",
     *     tags={"Auth"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Logged out")
     * )
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response([
            'message' => 'Logged out'
        ], 200);
    }

    /**
     * @OA\Get(
     *     path="/api/me",
     *     summary="Current authenticated user",
     *     tags={"Auth"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Authenticated user",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="user", ref="#/components/schemas/UserResource")
     *         )
     *     )
     * )
     */
    public function me(Request $request)
    {
        return response([
            'user' => $request->user()
        ], 200);
    }
}
