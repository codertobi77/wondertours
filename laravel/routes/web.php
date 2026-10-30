<?php

use Illuminate\Support\Facades\Route;
use App\Models\Circuit;
use App\Models\Testimonial;
use App\Models\BlogPost;
use App\Models\Service;
use App\Models\Destination;
use App\Models\Category;
use App\Models\BlogCategory;
use App\Models\Setting;

Route::get('/', function () {
    return view('home', [
        'circuits' => Circuit::with(['destination', 'categories'])
            ->where('is_active', true)->orderByDesc('is_featured')->orderByDesc('created_at')->take(6)->get(),
        'testimonials' => Testimonial::where('is_active', true)->orderByDesc('is_featured')->orderByDesc('date')->get(),
        'posts' => BlogPost::with('category')->where('is_published', true)->orderByDesc('is_featured')->orderByDesc('published_at')->take(3)->get(),
        'services' => Service::where('is_active', true)->orderBy('sort_order')->orderBy('created_at')->get(),
        'destinations' => Destination::where('is_active', true)->orderBy('name')->get(),
    ]);
});

Route::get('/circuits', function () {
    return view('circuits', [
        'circuits' => Circuit::with(['destination', 'categories'])->where('is_active', true)->orderByDesc('is_featured')->orderByDesc('created_at')->get(),
        'destinations' => Destination::where('is_active', true)->orderBy('name')->get(),
        'categories' => Category::where('is_active', true)->orderBy('sort_order')->orderBy('name')->get(),
    ]);
});

Route::get('/circuits/{slug}', function (string $slug) {
    $circuit = Circuit::with(['destination', 'categories'])->where('slug', $slug)->where('is_active', true)->firstOrFail();
    return view('circuit-detail', ['circuit' => $circuit]);
});

Route::get('/blog', function () {
    return view('blog', [
        'posts' => BlogPost::with('category')->where('is_published', true)->orderByDesc('is_featured')->orderByDesc('published_at')->get(),
        'categories' => BlogCategory::where('is_active', true)->orderBy('sort_order')->orderBy('name')->get(),
    ]);
});

Route::get('/blog/{slug}', function (string $slug) {
    $post = BlogPost::with('category')->where('slug', $slug)->where('is_published', true)->firstOrFail();
    $post->increment('views');
    return view('blog-post', ['post' => $post]);
});

Route::get('/contact', fn () => view('contact'));

Route::get('/a-propos', function () {
    $settings = Setting::whereIn('key', ['founder_bio_fr', 'founder_bio_en'])->pluck('value', 'key');
    return view('about', [
        'founderBioFr' => $settings['founder_bio_fr'] ?? null,
        'founderBioEn' => $settings['founder_bio_en'] ?? null,
    ]);
});

Route::get('/temoignages', function () {
    return view('testimonials', [
        'testimonials' => Testimonial::where('is_active', true)->orderByDesc('is_featured')->orderByDesc('date')->get(),
    ]);
});

Route::get('/sejours', fn () => view('sejours'));
Route::get('/hotels', fn () => view('hotels'));

Route::get('/dashboard/login', fn () => view('dashboard-login'));
Route::get('/dashboard/{any?}', fn () => view('dashboard'))->where('any', '.*');
