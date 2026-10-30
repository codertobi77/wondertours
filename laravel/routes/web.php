<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Circuit;
use App\Models\Testimonial;
use App\Models\BlogPost;
use App\Models\Service;
use App\Models\Destination;

Route::get('/', function () {
    return Inertia::render('Home', [
        'circuits' => Circuit::with(['destination', 'categories'])
            ->where('is_active', true)->orderByDesc('is_featured')->orderByDesc('created_at')->take(6)->get(),
        'testimonials' => Testimonial::where('is_active', true)->orderByDesc('is_featured')->orderByDesc('date')->get(),
        'posts' => BlogPost::with('category')->where('is_published', true)->orderByDesc('is_featured')->orderByDesc('published_at')->take(3)->get(),
        'services' => Service::where('is_active', true)->orderBy('sort_order')->orderBy('created_at')->get(),
        'destinations' => Destination::where('is_active', true)->orderBy('name')->get(),
    ]);
});

Route::get('/circuits', function () {
    $circuits = Circuit::with(['destination', 'categories'])->where('is_active', true)->orderByDesc('is_featured')->orderByDesc('created_at')->get();
    $destinations = Destination::where('is_active', true)->orderBy('name')->get();
    $categories = \App\Models\Category::where('is_active', true)->orderBy('sort_order')->orderBy('name')->get();
    return Inertia::render('Circuits', [
        'circuits' => $circuits,
        'destinations' => $destinations,
        'categories' => $categories,
    ]);
});

Route::get('/circuits/{slug}', function (string $slug) {
    $circuit = Circuit::with(['destination', 'categories'])->where('slug', $slug)->where('is_active', true)->firstOrFail();
    return Inertia::render('CircuitDetail', ['circuit' => $circuit]);
});

Route::get('/blog', function () {
    $posts = BlogPost::with('category')->where('is_published', true)->orderByDesc('is_featured')->orderByDesc('published_at')->get();
    $categories = \App\Models\BlogCategory::where('is_active', true)->orderBy('sort_order')->orderBy('name')->get();
    return Inertia::render('Blog', ['posts' => $posts, 'categories' => $categories]);
});

Route::get('/blog/{slug}', function (string $slug) {
    $post = BlogPost::with('category')->where('slug', $slug)->where('is_published', true)->firstOrFail();
    $post->increment('views');
    return Inertia::render('BlogPost', ['post' => $post]);
});

Route::get('/contact', fn () => Inertia::render('Contact'));
Route::get('/a-propos', fn () => Inertia::render('About'));
Route::get('/temoignages', function () {
    $testimonials = Testimonial::where('is_active', true)->orderByDesc('is_featured')->orderByDesc('date')->get();
    return Inertia::render('Testimonials', ['testimonials' => $testimonials]);
});

// Dashboard routes (SPA - all handled by React)
Route::get('/dashboard/{any?}', fn () => Inertia::render('Dashboard'))->where('any', '.*');
Route::get('/dashboard/login', fn () => Inertia::render('DashboardLogin'));
Route::get('/dashboard/forgot-password', fn () => Inertia::render('ForgotPassword'));
Route::get('/dashboard/reset-password', fn () => Inertia::render('ResetPassword'));
