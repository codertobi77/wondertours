<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\Db;
use WT\External;
use WT\Http;
use WT\MailTemplates;
use WT\Password;
use WT\Router;
use WT\Serial;
use WT\Support;
use WT\Validator;

/**
 * Utilisateurs dashboard — port des routes app/api/dashboard/users.
 * Hors moteur Crud (rôles distincts par route) : liste admin seule,
 * GET /{id} tout rôle authentifié, écritures admin.
 *
 * publicUser : jamais de password_hash dans les réponses (Model::USER).
 */
final class UsersApi
{
    private const ROLES = ['admin', 'editor', 'viewer'];

    public static function registerRoutes(): void
    {
        Router::get('/api/dashboard/users', [self::class, 'list']);
        Router::post('/api/dashboard/users', [self::class, 'create']);
        Router::get('/api/dashboard/users/{id}', [self::class, 'get']);
        Router::patch('/api/dashboard/users/{id}', [self::class, 'update']);
        Router::delete('/api/dashboard/users/{id}', [self::class, 'delete']);
    }

    /** GET liste — admin uniquement ; filtres role/active, q email/prénom/nom. */
    public static function list(): never
    {
        Auth::requireSession(['admin']);

        $v = Validator::query();
        $page = $v->page();
        $pageSize = $v->pageSize();
        $q = $v->q();
        $role = $v->queryEnum('role', self::ROLES);
        $active = $v->boolQuery('active');
        $v->fail();

        $where = [];
        $params = [];
        if ($role !== null) {
            $where[] = 't.role = ?';
            $params[] = $role;
        }
        if ($active !== null) {
            $where[] = $active ? 't.is_active = true' : 't.is_active = false';
        }
        if ($q !== null) {
            $where[] = '(t.email ILIKE ? OR t.first_name ILIKE ? OR t.last_name ILIKE ?)';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
            $params[] = '%' . $q . '%';
        }
        $whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $rows = Db::all(
            'SELECT t.* FROM users t' . $whereSql
            . ' ORDER BY t.created_at DESC'
            . ' LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
            $params
        );
        $total = (int) Db::val('SELECT COUNT(*) FROM users t' . $whereSql, $params);
        Http::ok(Serial::list(
            array_map(static fn (array $row): array => Serial::publicUser($row), $rows),
            $total,
            $page,
            $pageSize
        ));
    }

    /**
     * POST — admin ; email SANS lowercase forcé (la route Next ne le fait
     * pas ici, contrairement au login) ; email de bienvenue best effort.
     */
    public static function create(): never
    {
        Auth::requireSession(['admin']);

        $v = Validator::body();
        $v->email('email', required: true);
        $v->password('password', 8, 100);
        $v->str('firstName', 1, 100);
        $v->str('lastName', 1, 100);
        $v->enum('role', self::ROLES, 'editor', nullable: false);
        $v->bool('isActive', true);
        $v->fail();
        $data = $v->d();

        $row = Db::one(
            'INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)'
            . ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
            [
                Db::uuid(),
                $data['email'],
                Password::hash($data['password']),
                $data['firstName'],
                $data['lastName'],
                $data['role'],
                $data['isActive'] ? 'true' : 'false',
                Support::now(),
                Support::now(),
            ]
        );
        $user = Serial::publicUser($row);

        // Email de bienvenue best effort — jamais le mot de passe en clair.
        $appUrl = External::getAppUrl();
        $email = MailTemplates::userWelcomeEmail([
            'name' => $data['firstName'],
            'email' => $data['email'],
            'role' => $data['role'],
            'dashboardUrl' => $appUrl . '/dashboard',
            'forgotPasswordUrl' => $appUrl . '/dashboard/forgot-password',
        ]);
        External::sendEmailSafe([
            'to' => $data['email'],
            'subject' => $email['subject'],
            'html' => $email['html'],
        ]);

        Http::created($user);
    }

    /** GET /{id} — tout rôle authentifié ; 404 « Utilisateur introuvable ». */
    public static function get(string $id): never
    {
        Auth::requireSession();

        if (!Support::isUuid($id)) {
            Http::notFound('Utilisateur introuvable');
        }
        $row = Db::one('SELECT * FROM users WHERE id = ?', [$id]);
        if ($row === null) {
            Http::notFound('Utilisateur introuvable');
        }
        Http::ok(Serial::publicUser($row));
    }

    /** PATCH /{id} — admin ; champs fournis seulement, @updatedAt toujours. */
    public static function update(string $id): never
    {
        Auth::requireSession(['admin']);

        if (!Support::isUuid($id)) {
            Http::notFound('Utilisateur introuvable');
        }
        $v = Validator::body();
        $v->email('email', required: false);
        $v->optPassword('password', 8, 100);
        $v->optStr('firstName', 100, 1, nullable: false);
        $v->optStr('lastName', 100, 1, nullable: false);
        $v->enum('role', self::ROLES);
        $v->optBool('isActive');
        $v->fail();
        $data = $v->d();

        $set = [];
        $params = [];
        foreach (['firstName' => 'first_name', 'lastName' => 'last_name', 'email' => 'email', 'role' => 'role'] as $key => $column) {
            if (array_key_exists($key, $data)) {
                $set[] = "$column = ?";
                $params[] = $data[$key];
            }
        }
        if (array_key_exists('password', $data)) {
            $set[] = 'password_hash = ?';
            $params[] = Password::hash($data['password']);
        }
        if (array_key_exists('isActive', $data)) {
            $set[] = 'is_active = ?';
            $params[] = $data['isActive'] ? 'true' : 'false';
        }
        $set[] = 'updated_at = ?'; // @updatedAt : toujours écrit par Prisma
        $params[] = Support::now();
        $params[] = $id;

        $row = Db::one(
            'UPDATE users SET ' . implode(', ', $set) . ' WHERE id = ? RETURNING *',
            $params
        );
        if ($row === null) {
            Http::notFound(); // P2025 → 404 « Ressource introuvable »
        }
        Http::ok(Serial::publicUser($row));
    }

    /** DELETE /{id} — admin ; {message: "Utilisateur supprimé", id}. */
    public static function delete(string $id): never
    {
        Auth::requireSession(['admin']);

        if (!Support::isUuid($id)) {
            Http::notFound('Utilisateur introuvable');
        }
        $deleted = Db::one('DELETE FROM users WHERE id = ? RETURNING id', [$id]);
        if ($deleted === null) {
            Http::notFound(); // P2025
        }
        Http::ok(['message' => 'Utilisateur supprimé', 'id' => $id]);
    }
}
