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

        $user = User::create($fields);
        $token = $user->createToken($user->name);

        $response = [
            'user' => $user,
            'token' => $token->plainTextToken
        ];

        return response($response, 201);
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
