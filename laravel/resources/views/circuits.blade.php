@extends('layouts.app')
@section('title','Circuits')
@section('content')

<section class="py-12 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="text-center mb-12">
      <h5 class="uppercase tracking-widest text-amber-600 text-sm font-semibold mb-3">Nos expériences incontournables</h5>
      <h1 class="font-heading text-3xl md:text-4xl font-bold text-text mb-4">Découvrez les destinations qui font la richesse<br />du Bénin, du Togo et du Ghana</h1>
    </div>
    @if($circuits->isNotEmpty())
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($circuits as $c)
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition hover:-translate-y-2 group">
        @if($c->image_url)
          <img src="{{ $c->image_url }}" alt="{{ $c->title }}" class="w-full h-52 object-cover">
        @else
          <div class="w-full h-52 img-fallback"></div>
        @endif
        <div class="p-6">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex flex-wrap gap-2">
              @foreach($c->categories ?? [] as $cat)
                <span class="bg-amber-600/10 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">{{ $cat->name }}</span>
              @endforeach
            </div>
            <div class="flex items-center text-text-secondary text-sm">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {{ $c->duration }}
            </div>
          </div>
          <h3 class="font-heading text-xl font-bold text-text mb-2 group-hover:text-amber-600 transition-colors">{{ $c->title }}</h3>
          <div class="flex items-center text-text-secondary text-sm mb-4">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {{ optional($c->destination)->name ?? '' }}
          </div>
          <div class="flex items-center justify-between mb-4">
            <div class="text-2xl font-bold text-amber-600">{{ $c->price }} {{ $c->currency }}</div>
            <span class="text-text-secondary text-sm">/ personne</span>
          </div>
          <a href="/circuits/{{ $c->slug }}" class="block w-full text-center bg-amber-600 text-white py-2.5 rounded-full font-medium hover:bg-amber-700 transition">Découvrir</a>
        </div>
      </div>
      @endforeach
    </div>
    @else
    <p class="text-center text-text-secondary">Aucun circuit disponible.</p>
    @endif
  </div>
</section>
@endsection
