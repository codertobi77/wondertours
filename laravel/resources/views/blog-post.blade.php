@extends('layouts.app')
@section('title', $post->title)
@section('content')

<article class="py-12 container mx-auto px-4 max-w-3xl">
    <h1 class="text-3xl font-bold mb-4">{{ $post->title }}</h1>
    <p class="text-gray-500 text-sm mb-6">{{ $post->published_at }} — {{ optional($post->category)->name ?? '' }}</p>
    <div class="prose max-w-none">{!! $post->content ?? '' !!}</div>
    <a href="/blog" class="text-amber-600 mt-6 inline-block">← Retour au blog</a>
</article>
@endsection
