@extends('layouts.app')
@section('title','Blog')
@section('content')

@component('components.hero', [
    'kicker' => 'CARNET DE VOYAGE',
    'title' => 'Conseils, culture et actualités',
    'subtitle' => 'Découvrez nos articles pour préparer votre voyage au Bénin, au Togo ou au Ghana : conseils pratiques, découvertes culturelles et inspirations.',
    'image' => '/photos_site%20wonder_tours/IMG_20260315_173923_4.jpg',
    'cta1Text' => 'Explorer les articles',
    'cta1Href' => '#articles',
    'cta2Text' => 'Planifier mon voyage',
    'cta2Href' => '/contact',
]) @endcomponent

<section id="articles" class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="text-center mb-12">
      @component('components.section-heading', ['kicker' => 'Derniers articles', 'title' => 'Nos publications récentes']) @endcomponent
    </div>
    @if($posts->isNotEmpty())
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      @foreach($posts as $p)
        @component('components.card')
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
        @endcomponent
      @endforeach
    </div>
    @else
      <p class="text-center text-text-secondary">Aucun article.</p>
    @endif
  </div>
</section>
@endsection
