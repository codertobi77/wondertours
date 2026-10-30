@extends('layouts.app')
@section('title','Témoignages')
@section('content')

<section class="relative bg-[#17221F] text-white py-20">
  <div class="absolute inset-0">
    <img src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg" alt="" class="h-full w-full object-cover opacity-40">
    <div class="absolute inset-0 bg-black/60"></div>
  </div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    @component('components.section-heading', ['kicker' => 'Ce que nos voyageurs disent', 'title' => 'Témoignages', 'subtitle' => 'Les expériences de nos voyageurs au Bénin, au Togo et au Ghana', 'class' => 'text-white']) @endcomponent
  </div>
</section>

<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    @if($testimonials->isNotEmpty())
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($testimonials as $t)
        @component('components.card', ['class' => 'p-6'])
          <div class="text-amber-500 text-lg mb-3">{{ str_repeat('★', (int) ($t->rating ?? 5)) }}</div>
          <p class="text-text-secondary italic leading-relaxed mb-4">"{{ $t->text }}"</p>
          <div class="flex items-center gap-3">
            @if($t->avatar_url) <img src="{{ $t->avatar_url }}" alt="" class="w-10 h-10 rounded-full object-cover">
            @else <div class="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-600 font-bold">{{ strtoupper(substr($t->name,0,1)) }}</div> @endif
            <div>
              <p class="font-bold text-text">{{ $t->name }}</p>
              <p class="text-text-secondary text-sm">{{ $t->country }}</p>
            </div>
          </div>
        @endcomponent
      @endforeach
    </div>
    @else
      <p class="text-center text-text-secondary">Aucun témoignage.</p>
    @endif
  </div>
</section>
@endsection
