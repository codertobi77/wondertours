@extends('layouts.app')
@section('title','Blog')
@section('content')

<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="text-center mb-12">
      <h1 class="font-heading text-3xl md:text-4xl font-bold text-text">Blog</h1>
      <p class="text-text-secondary mt-4 max-w-2xl mx-auto">L'actualité et les conseils de Wonder Tours and Services.</p>
    </div>
    @if($posts->isNotEmpty())
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($posts as $p)
      <a href="/blog/{{ $p->slug }}" class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition hover:-translate-y-2 block group">
        @if($p->image_url)
          <img src="{{ $p->image_url }}" alt="{{ $p->title }}" class="w-full h-52 object-cover">
        @else
          <div class="w-full h-52 img-fallback"></div>
        @endif
        <div class="p-6">
          <span class="bg-amber-600/10 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">{{ optional($p->category)->name ?? 'Blog' }}</span>
          <h3 class="font-heading text-xl font-bold text-text mt-3 mb-2 group-hover:text-amber-600 transition-colors">{{ $p->title }}</h3>
          <p class="text-text-secondary text-sm line-clamp-3">{{ $p->excerpt }}</p>
        </div>
      </a>
      @endforeach
    </div>
    @else
      <p class="text-center text-text-secondary">Aucun article.</p>
    @endif
  </div>
</section>
@endsection
