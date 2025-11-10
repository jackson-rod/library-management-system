<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|string|in:Admin,User',
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

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response([
            'message' => 'Logged out'
        ], 200);
    }

    public function me(Request $request)
    {
        return response([
            'user' => $request->user()
        ], 200);
    }
}
