@extends('layouts.app')
@section('title', $circuit->title)
@section('content')

<article class="py-12 container mx-auto px-4 max-w-4xl">
    <h1 class="text-3xl font-bold mb-2">{{ $circuit->title }}</h1>
    <p class="text-gray-600 mb-6">{{ $circuit->subtitle }}</p>
    <div class="grid md:grid-cols-2 gap-8 mb-8">
        @if($circuit->image_url)
        <img src="{{ $circuit->image_url }}" alt="{{ $circuit->title }}" class="rounded-lg w-full object-cover">
        @endif
        <div>
            <p class="text-lg mb-4">{{ $circuit->description }}</p>
            <p class="font-bold text-amber-600 text-xl">{{ $circuit->price }} {{ $circuit->currency }}</p>
            <ul class="mt-4 text-sm text-gray-600 space-y-1">
                <li><strong>Durée :</strong> {{ $circuit->duration }}</li>
                <li><strong>Participants :</strong> {{ $circuit->min_participants }} – {{ $circuit->max_participants }}</li>
                <li><strong>Destination :</strong> {{ optional($circuit->destination)->name ?? '' }}</li>
            </ul>
            @if(!empty($circuit->categories))
            <div class="mt-4 flex gap-2 flex-wrap">
                @foreach($circuit->categories as $cat)
                    <span class="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">{{ $cat->name }}</span>
                @endforeach
            </div>
            @endif
        </div>
    </div>
    @if(!empty($circuit->itinerary))
    <section class="mb-8">
        <h2 class="text-xl font-bold mb-3">Itinéraire</h2>
        <ul class="space-y-2">
            @foreach($circuit->itinerary as $step)
                <li class="border-l-4 border-amber-400 pl-4">{{ is_string($step) ? $step : ($step['description'] ?? json_encode($step)) }}</li>
            @endforeach
        </ul>
    </section>
    @endif
    @if(!empty($circuit->highlights))
    <section class="mb-8">
        <h2 class="text-xl font-bold mb-3">Points forts</h2>
        <ul class="list-disc pl-5">
            @foreach($circuit->highlights as $h)
                <li>{{ $h }}</li>
            @endforeach
        </ul>
    </section>
    @endif
</article>
@endsection
