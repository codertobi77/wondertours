@extends('layouts.app')
@section('title','Circuits')
@section('content')

<section class="py-12 container mx-auto px-4">
    <h1 class="text-3xl font-bold mb-6">Nos circuits</h1>
    <div class="grid md:grid-cols-3 gap-6">
        @foreach($circuits as $c)
        <a href="/circuits/{{ $c->slug }}" class="border rounded-lg p-4 bg-white hover:shadow-lg transition block">
            <h3 class="font-bold">{{ $c->title }}</h3>
            <p class="text-sm text-gray-600">{{ optional($c->destination)->name ?? '' }}</p>
            <p class="text-amber-600 font-bold mt-2">{{ $c->price }} {{ $c->currency }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ $c->duration }} &bull; {{ $c->difficulty }}</p>
        </a>
        @endforeach
    </div>
    @if($circuits->isEmpty())
        <p class="text-gray-500">Aucun circuit disponible.</p>
    @endif
</section>
@endsection
