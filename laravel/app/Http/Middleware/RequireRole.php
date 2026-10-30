<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $payload = $request->attributes->get('jwt_payload');
        if (!$payload || !in_array($payload['role'] ?? '', $roles, true)) {
            return response()->json(['error' => 'Accès refusé'], 403);
        }
        return $next($request);
    }
}
