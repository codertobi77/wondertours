<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;

// ── API publique ──
Route::get('/circuits', [PublicController::class, 'circuits']);
Route::get('/circuits/{slug}', [PublicController::class, 'circuitBySlug']);
Route::get('/destinations', [PublicController::class, 'destinations']);
Route::get('/categories', [PublicController::class, 'categories']);
Route::get('/services', [PublicController::class, 'services']);
Route::get('/testimonials', [PublicController::class, 'testimonials']);
Route::get('/blog', [PublicController::class, 'blog']);
Route::get('/blog/{slug}', [PublicController::class, 'blogBySlug']);
Route::get('/blog-categories', [PublicController::class, 'blogCategories']);
Route::get('/settings', [PublicController::class, 'settings']);
Route::post('/contact', [PublicController::class, 'contact']);
Route::post('/bookings', [PublicController::class, 'bookings']);

// ── Auth ──
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// ── Dashboard (authentifié) — routes spécifiques AVANT la générique ──
Route::middleware('jwt.auth')->group(function () {
    Route::post('/dashboard/publish', [DashboardController::class, 'publish'])->middleware('require.role:admin,editor');

    Route::get('/dashboard/bookings', [DashboardController::class, 'bookingsIndex']);
    Route::patch('/dashboard/bookings/{id}/status', [DashboardController::class, 'bookingStatus']);
    Route::get('/dashboard/contact-requests', [DashboardController::class, 'contactRequestsIndex']);
    Route::patch('/dashboard/contact-requests/{id}/status', [DashboardController::class, 'contactRequestStatus']);
    Route::post('/dashboard/media', [DashboardController::class, 'mediaUpload']);
    Route::delete('/dashboard/media/{id}', [DashboardController::class, 'mediaDelete']);
    Route::get('/dashboard/settings', [DashboardController::class, 'settingsIndex']);
    Route::put('/dashboard/settings', [DashboardController::class, 'settingsUpdate'])->middleware('require.role:admin,editor');
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::post('/dashboard/translate', [DashboardController::class, 'translate']);
    Route::get('/dashboard/users', [DashboardController::class, 'usersIndex'])->middleware('require.role:admin');
    Route::post('/dashboard/users', [DashboardController::class, 'usersStore'])->middleware('require.role:admin');
    Route::patch('/dashboard/users/{id}', [DashboardController::class, 'usersUpdate'])->middleware('require.role:admin');
    Route::delete('/dashboard/users/{id}', [DashboardController::class, 'usersDestroy'])->middleware('require.role:admin');

    // Générique (doit être en dernier)
    Route::get('/dashboard/{resource}', [DashboardController::class, 'index']);
    Route::post('/dashboard/{resource}', [DashboardController::class, 'store']);
    Route::get('/dashboard/{resource}/{id}', [DashboardController::class, 'show']);
    Route::patch('/dashboard/{resource}/{id}', [DashboardController::class, 'update']);
    Route::delete('/dashboard/{resource}/{id}', [DashboardController::class, 'destroy']);
});
