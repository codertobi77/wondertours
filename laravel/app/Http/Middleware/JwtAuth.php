<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('wt_session');
        if (!$token) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }
        // Verify JWT (HS256)
        $secret = env('AUTH_SECRET', '');
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return response()->json(['error' => 'Session invalide'], 401);
        }
        [$h, $p, $s] = $parts;
        $sig = base64_decode(strtr($s, '-_', '+/'));
        $expected = hash_hmac('sha256', "$h.$p", $secret, true);
        if (!hash_equals($expected, $sig)) {
            return response()->json(['error' => 'Session invalide'], 401);
        }
        $payload = json_decode(base64_decode(strtr($p, '-_', '+/')), true);
        if (!is_array($payload) || ($payload['exp'] ?? 0) < time()) {
            return response()->json(['error' => 'Session expirée'], 401);
        }
        $request->attributes->set('jwt_payload', $payload);
        return $next($request);
    }
}
