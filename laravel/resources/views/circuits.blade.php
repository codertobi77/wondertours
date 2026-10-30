@extends('layouts.app')
@section('title','Circuits')
@section('content')

@component('components.hero', [
    'kicker' => 'NOS CIRCUITS',
    'title' => 'Explorez nos circuits touristiques',
    'subtitle' => 'Découvrez le Bénin, le Togo et le Ghana à travers nos circuits soigneusement conçus pour vous offrir des expériences authentiques et inoubliables.',
    'image' => '/photos_site%20wonder_tours/IMG_20240112_112544_4.jpg',
    'cta1Text' => 'Demander un devis',
    'cta1Href' => '/contact',
    'cta2Text' => 'Voir tous les circuits',
    'cta2Href' => '/circuits',
]) @endcomponent

<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="text-center mb-12">
      @component('components.section-heading', ['kicker' => 'Nos expériences incontournables', 'title' => 'Découvrez les destinations qui font la richesse du Bénin, du Togo et du Ghana']) @endcomponent
    </div>
    @if($circuits->isNotEmpty())
    <div class="mb-8">
      <p class="text-text-secondary text-sm mb-3">Filtrer par catégorie</p>
      <div class="flex flex-wrap gap-2">
        @foreach ($categories ?? [] as $cat)
          <a href="/circuits?category={{ $cat->slug }}" class="px-4 py-2 rounded-full border border-amber-600/30 text-amber-700 text-sm font-medium hover:bg-amber-600 hover:text-white transition">{{ $cat->name }}</a>
        @endforeach
      </div>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($circuits as $c)
        @component('components.card')
          @if($c->image_url)
            <img src="{{ $c->image_url }}" alt="{{ $c->title }}" class="w-full h-52 object-cover">
          @else
            <div class="w-full h-52 img-fallback"></div>
          @endif
          <div class="p-6">
            <div class="flex items-center justify-between gap-2 mb-3">
              <div class="flex flex-wrap gap-2">
                @foreach($c->categories ?? [] as $cat)
                  @component('components.badge', ['text' => $cat->name]) @endcomponent
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
        @endcomponent
      @endforeach
    </div>
    <div class="text-center mt-12">
      <a href="/circuits" class="border border-amber-600 text-amber-600 px-8 py-3 rounded-full font-medium hover:bg-amber-600 hover:text-white transition">Voir tous les circuits</a>
    </div>
    @else
    <p class="text-center text-text-secondary">Aucun circuit disponible.</p>
    @endif
  </div>
</section>

<!-- CTA Section -->
<section class="py-16 bg-white">
  <div class="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    <h2 class="font-heading text-3xl font-bold text-text mb-4">Prêt à voyager avec nous ?</h2>
    <p class="text-text-secondary text-lg mb-8">Contactez-nous pour un circuit sur mesure adapté à vos envies et votre budget.</p>
    <a href="/contact" class="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-medium transition">Demander un devis</a>
  </div>
</section>
@endsection
