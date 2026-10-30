@extends('layouts.app')
@section('title', 'Accueil')
@section('content')

<!-- Hero -->
<section class="relative bg-[#17221F] text-white">
  <img src="/photos_site wonder_tours/IMG-20260805-WA0065.jpg" alt="" class="absolute inset-0 w-full h-full object-cover opacity-40">
  <div class="absolute inset-0 bg-black/60"></div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 py-24 text-center max-w-4xl mx-auto">
    <h5 class="uppercase tracking-widest text-amber-400 text-sm font-semibold mb-6">EXPLOREZ LE BÉNIN, LE TOGO ET LE GHANA AUTREMENT</h5>
    <h1 class="font-heading text-4xl md:text-6xl font-bold mb-6">Découvrez le Bénin, le Togo et le Ghana à travers<br />des expériences authentiques.</h1>
    <p class="text-gray-200 text-lg mb-8 max-w-3xl mx-auto">Avec plus de 20 ans d'expertise, Wonder Tours and Services vous accompagne dans la découverte du patrimoine culturel et naturel du Bénin, du Togo et du Ghana.</p>
    <div class="flex items-center justify-center gap-4 flex-wrap">
      <a href="/circuits" class="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-medium transition">Découvrir nos circuits</a>
      <a href="/contact" class="border border-white text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition">Planifier mon voyage</a>
    </div>
  </div>
</section>

<!-- Experience section -->
<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <div class="text-6xl font-heading font-bold text-amber-600 mb-4">20+</div>
        <h2 class="font-heading text-3xl font-bold text-text mb-4">années d'expérience</h2>
        <p class="text-text-secondary leading-relaxed">Une expertise construite au fil de nombreuses années d'accompagnement de voyageurs du monde entier dans la découverte du Bénin, du Togo et du Ghana.</p>
      </div>
      <div class="relative max-w-md mx-auto">
        <img src="/photos_site%20wonder_tours/FB_IMG_1766953938984.jpg" alt="Notre équipe" class="rounded-2xl shadow-2xl w-full">
      </div>
    </div>
  </div>
</section>

<!-- Circuits -->
<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="text-center mb-12">
      <h5 class="uppercase tracking-widest text-amber-600 text-sm font-semibold mb-3">Nos expériences incontournables</h5>
      <h2 class="font-heading text-3xl font-bold text-text">Découvrez les destinations qui font la richesse<br />du Bénin, du Togo et du Ghana</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($circuits as $c)
        <a href="/circuits/{{ $c->slug }}" class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition block">
          @if($c->image_url)
            <img src="{{ $c->image_url }}" alt="{{ $c->title }}" class="w-full h-48 object-cover">
          @else
            <div class="w-full h-48 img-fallback"></div>
          @endif
          <div class="p-6">
            <span class="text-xs uppercase tracking-widest text-amber-600">{{ optional($c->destination)->name ?? '' }}</span>
            <h3 class="font-heading text-xl font-bold mt-2">{{ $c->title }}</h3>
            <p class="text-text-secondary text-sm mt-2 line-clamp-2">{{ $c->subtitle }}</p>
            <div class="mt-4 text-amber-600 font-bold">{{ $c->price }} {{ $c->currency }}</div>
          </div>
        </a>
      @endforeach
    </div>
    <div class="text-center mt-12">
      <a href="/circuits" class="border border-amber-600 text-amber-600 px-8 py-3 rounded-full font-medium hover:bg-amber-600 hover:text-white transition">Voir tous les circuits</a>
    </div>
  </div>
</section>

<!-- Why choose us -->
<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="font-heading text-3xl font-bold text-text">Voyagez avec une équipe qui connaît<br />le Bénin, le Togo et le Ghana</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      @php $why = [
        ['20+ ans d\'expérience', 'Une expertise construite au fil de nombreuses années.'],
        ['Expériences authentiques', 'Découvrir le pays au-delà des parcours touristiques classiques.'],
        ['Accompagnement personnalisé', 'Des solutions adaptées aux besoins de chaque voyageur.'],
        ['Expertise locale', 'Une équipe qui connaît la réalité du terrain.'],
      ]; @endphp
      @foreach($why as $i => $item)
        <div class="text-center p-6 border-2 border-amber-500 rounded-xl">
          <div class="w-16 h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-amber-600">{{ $i + 1 }}</span>
          </div>
          <h3 class="font-heading text-xl font-bold text-text mb-3">{{ $item[0] }}</h3>
          <p class="text-text-secondary">{{ $item[1] }}</p>
        </div>
      @endforeach
    </div>
  </div>
</section>

<!-- Destinations teaser -->
<section class="py-20 relative">
  <div class="absolute inset-0">
    <img src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg" alt="Le Bénin, le Togo et le Ghana" class="h-full w-full object-cover">
    <div class="absolute inset-0 bg-black/60"></div>
  </div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center text-white">
    <h2 class="font-heading text-3xl font-bold text-white mb-4">Le Bénin, le Togo et le Ghana vous attendent</h2>
    <p class="text-xl mb-8 max-w-2xl mx-auto text-gray-200">D'Ouidah à Abomey, de Lomé à Kumasi, découvrez des pays riches en histoire, en culture et en paysages exceptionnels.</p>
  </div>
</section>

<!-- Testimonials -->
@if($testimonials->isNotEmpty())
<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="font-heading text-3xl font-bold text-text">Ce que nos voyageurs disent</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($testimonials->take(3) as $t)
        <div class="bg-white p-6 rounded-2xl shadow-sm">
          <p class="text-text-secondary italic">"{{ $t->text }}"</p>
          <p class="font-bold mt-4">{{ $t->name }} — {{ $t->country }}</p>
        </div>
      @endforeach
    </div>
  </div>
</section>
@endif
@endsection
