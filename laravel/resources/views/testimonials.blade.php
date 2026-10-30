@extends('layouts.app')
@section('title','Témoignages')
@section('content')

<section class="relative bg-[#17221F] text-white py-20">
  <div class="absolute inset-0">
    <img src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg" alt="" class="h-full w-full object-cover opacity-40">
    <div class="absolute inset-0 bg-black/60"></div>
  </div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    <h5 class="uppercase tracking-widest text-amber-400 text-sm font-semibold mb-3">Ce que nos voyageurs disent</h5>
    <h1 data-i18n="testim.page" class="font-heading text-4xl md:text-5xl font-bold mb-4">Témoignages</h1>
    <p class="text-gray-200 text-lg">Les expériences de nos voyageurs au Bénin, au Togo et au Ghana.</p>
  </div>
</section>

<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    @if($testimonials->isNotEmpty())
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($testimonials as $t)
      <div class="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition">
        <div class="text-amber-500 text-lg mb-3">{{ str_repeat('★', (int) ($t->rating ?? 5)) }}</div>
        <p class="text-text-secondary italic leading-relaxed">"{{ $t->text }}"</p>
        <div class="mt-4 flex items-center gap-3">
          @if($t->avatar_url)
            <img src="{{ $t->avatar_url }}" alt="{{ $t->name }}" class="w-10 h-10 rounded-full object-cover">
          @else
            <div class="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-600 font-bold">{{ strtoupper(substr($t->name,0,1)) }}</div>
          @endif
          <div>
            <p class="font-bold text-text">{{ $t->name }}</p>
            <p class="text-text-secondary text-sm">{{ $t->country }}</p>
          </div>
        </div>
      </div>
      @endforeach
    </div>
    @else
      <p class="text-center text-text-secondary">Aucun témoignage.</p>
    @endif
  </div>
</section>
@endsection
