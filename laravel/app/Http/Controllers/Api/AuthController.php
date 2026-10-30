<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private function secret(): string
    {
        return env('AUTH_SECRET', '');
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        $pad = strlen($data) % 4;
        if ($pad) $data .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($data, '-_', '+/'));
    }

    private function signJwt(array $payload): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $h = $this->base64UrlEncode(json_encode($header));
        $p = $this->base64UrlEncode(json_encode($payload));
        $sig = hash_hmac('sha256', "$h.$p", $this->secret(), true);
        return "$h.$p." . $this->base64UrlEncode($sig);
    }

    private function verifyJwt(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$h, $p, $s] = $parts;
        $sig = $this->base64UrlDecode($s);
        $expected = hash_hmac('sha256', "$h.$p", $this->secret(), true);
        if (!hash_equals($expected, $sig)) return null;
        $payload = json_decode($this->base64UrlDecode($p), true);
        if (!is_array($payload)) return null;
        if (isset($payload['exp']) && $payload['exp'] < time()) return null;
        return $payload;
    }

    private function setSessionCookie(string $token): void
    {
        $secure = str_starts_with(env('APP_URL', ''), 'https');
        setcookie('wt_session', $token, [
            'expires' => time() + 7 * 24 * 3600,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        $user = User::where('email', $data['email'])->where('is_active', true)->first();
        if (!$user || !password_verify($data['password'], $user->password_hash)) {
            return response()->json(['error' => 'Identifiants invalides'], 401);
        }
        $user->last_login_at = now();
        $user->save();
        $token = $this->signJwt([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'name' => trim($user->first_name . ' ' . $user->last_name),
            'iat' => time(),
            'exp' => time() + 7 * 24 * 3600,
        ]);
        $this->setSessionCookie($token);
        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'role' => $user->role,
                'name' => trim($user->first_name . ' ' . $user->last_name),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        setcookie('wt_session', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true]);
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function me(Request $request)
    {
        $token = $request->cookie('wt_session');
        if (!$token) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }
        $payload = $this->verifyJwt($token);
        if (!$payload) {
            return response()->json(['error' => 'Session invalide'], 401);
        }
        $user = User::find($payload['sub']);
        if (!$user || !$user->is_active) {
            return response()->json(['error' => 'Utilisateur introuvable'], 401);
        }
        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'role' => $user->role,
                'name' => trim($user->first_name . ' ' . $user->last_name),
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);
        $user = User::where('email', $data['email'])->where('is_active', true)->first();
        if ($user) {
            $token = Str::random(64);
            $hash = hash('sha256', $token);
            PasswordResetToken::create([
                'user_id' => $user->id,
                'token_hash' => $hash,
                'expires_at' => now()->addHour(),
            ]);
            // Email sending would go here (best-effort, like PHP)
        }
        return response()->json(['message' => 'Si un compte actif existe avec cet email, un lien de réinitialisation vient d\'être envoyé.']);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8',
        ]);
        $hash = hash('sha256', $data['token']);
        $resetToken = PasswordResetToken::where('token_hash', $hash)->whereNull('used_at')->first();
        if (!$resetToken || $resetToken->expires_at < now()) {
            return response()->json(['error' => 'Token invalide ou expiré'], 400);
        }
        $user = User::find($resetToken->user_id);
        if (!$user) {
            return response()->json(['error' => 'Utilisateur introuvable'], 400);
        }
        $user->password_hash = Hash::make($data['password']);
        $user->save();
        $resetToken->used_at = now();
        $resetToken->save();
        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }
}
