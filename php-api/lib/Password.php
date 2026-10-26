<?php

declare(strict_types=1);

namespace WT;

/**
 * Hachage bcrypt — interopérable avec bcryptjs (seed, dashboard Next,
 * éventuel retour à la stack Next) :
 *   - hash : password_hash produit le préfixe PHP « $2y$ » ; il est réécrit
 *     en « $2a$ » (algorithme identique, forme canonique comprise de tous
 *     les bcrypt JS) ;
 *   - verify : password_verify accepte nativement $2a$/$2b$/$2y$ ;
 *   - coût 10 des deux côtés (bcrypt.hash(pw, 10) par défaut).
 */
final class Password
{
    public static function hash(string $password): string
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        if (!is_string($hash)) {
            throw new \RuntimeException('Impossible de hacher le mot de passe');
        }
        return str_replace('$2y$', '$2a$', $hash);
    }

    public static function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
}
