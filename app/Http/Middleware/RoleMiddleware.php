<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (empty($roles)) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return $this->forbiddenResponse();
        }

        return $next($request);
    }

    protected function forbiddenResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
        ], Response::HTTP_FORBIDDEN);
    }
}


