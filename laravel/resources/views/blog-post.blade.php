@extends('layouts.app')
@section('title', $post->title)
@section('content')

<section class="relative bg-[#17221F] text-white py-16">
  @if($post->image_url)
    <img src="{{ $post->image_url }}" alt="{{ $post->title }}" class="absolute inset-0 w-full h-full object-cover opacity-40">
    <div class="absolute inset-0 bg-black/60"></div>
  @endif
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    <span class="bg-amber-600/90 text-white text-xs font-medium px-3 py-1 rounded-full">{{ optional($post->category)->name ?? 'Blog' }}</span>
    <h1 class="font-heading text-4xl md:text-5xl font-bold mt-4 mb-4">{{ $post->title }}</h1>
    <p class="text-gray-200">{{ $post->published_at ? \Carbon\Carbon::parse($post->published_at)->format('d/m/Y') : '' }}</p>
  </div>
</section>

<section class="py-16 bg-white">
  <div class="container mx-auto px-4 lg:px-8 max-w-3xl prose prose-lg max-w-none">
    @if($post->excerpt)<p class="text-xl text-text-secondary font-medium">{{ $post->excerpt }}</p>@endif
    <div class="text-text leading-relaxed">{!! $post->content ?? '' !!}</div>
    <a href="/blog" class="text-amber-600 font-medium mt-8 inline-block">← Retour au blog</a>
  </div>
</section>
@endsection
