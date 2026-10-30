@extends('layouts.app')
@section('title', $circuit->title)
@section('content')

<section class="py-12 bg-white">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="grid md:grid-cols-2 gap-8">
      <div>
        @if($circuit->image_url)
          <img src="{{ $circuit->image_url }}" alt="{{ $circuit->title }}" class="w-full h-96 object-cover rounded-2xl shadow-lg">
        @else
          <div class="w-full h-96 img-fallback rounded-2xl"></div>
        @endif
      </div>
      <div>
        <span class="text-xs uppercase tracking-widest text-amber-600">{{ optional($circuit->destination)->name ?? '' }}</span>
        <h1 class="font-heading text-4xl font-bold text-text mt-2 mb-4">{{ $circuit->title }}</h1>
        <p class="text-text-secondary mb-6">{{ $circuit->subtitle }}</p>
        <div class="flex flex-wrap gap-2 mb-4">
          @foreach($circuit->categories ?? [] as $cat)
            <span class="bg-amber-600/10 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">{{ $cat->name }}</span>
          @endforeach
        </div>
        @component('components.card', ['class'=>'p-6 mb-6 space-y-2'])
          <div class="flex justify-between"><span class="text-text-secondary">Durée</span><span class="font-medium text-text">{{ $circuit->duration }}</span></div>
          <div class="flex justify-between"><span class="text-text-secondary">Prix</span><span class="text-2xl font-bold text-amber-600">{{ $circuit->price }} {{ $circuit->currency }}</span></div>
          <div class="flex justify-between"><span class="text-text-secondary">Participants</span><span class="font-medium text-text">{{ $circuit->min_participants }} – {{ $circuit->max_participants }}</span></div>
          <div class="flex justify-between"><span class="text-text-secondary">Difficulté</span><span class="font-medium text-text">{{ $circuit->difficulty }}</span></div>
        @endcomponent
        <a href="/contact" class="block w-full text-center bg-amber-600 text-white py-3 rounded-full font-medium hover:bg-amber-700 transition mb-2">Planifier mon voyage</a>
        <button onclick="addToCart('{{ $circuit->title }}')" class="block w-full text-center border border-amber-600 text-amber-600 py-3 rounded-full font-medium hover:bg-amber-600/10 transition">Ajouter à ma réservation</button>
      </div>
    </div>
  </div>
</section>

@if($circuit->description)
<section class="py-16 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8 max-w-4xl">
    <h2 class="font-heading text-2xl font-bold text-text mb-4">Description</h2>
    <p class="text-text-secondary leading-relaxed mb-6">{{ $circuit->description }}</p>
    @if(!empty($circuit->highlights))
    <h3 class="font-heading text-xl font-bold text-text mb-3">Points forts</h3>
    <ul class="list-disc pl-5 text-text-secondary space-y-1 mb-6">
      @foreach($circuit->highlights as $h)<li>{{ $h }}</li>@endforeach
    </ul>
    @endif
    @if(!empty($circuit->itinerary))
    <h3 class="font-heading text-xl font-bold text-text mb-3">Itinéraire</h3>
    <ul class="space-y-2">
      @foreach($circuit->itinerary as $step)
        <li class="border-l-4 border-amber-400 pl-4 text-text-secondary">{{ is_string($step) ? $step : ($step['description'] ?? json_encode($step)) }}</li>
      @endforeach
    </ul>
    @endif
  </div>
</section>
@endif
@endsection
