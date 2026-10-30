@extends('layouts.app')
@section('title','Témoignages')
@section('content')

<section class="py-12 container mx-auto px-4">
    <h1 class="text-3xl font-bold mb-6">Témoignages</h1>
    <div class="grid md:grid-cols-2 gap-6">
        @foreach($testimonials as $t)
        <div class="border rounded-lg p-4 bg-white">
            <p class="text-gray-600 italic">"{{ $t->text }}"</p>
            <p class="font-bold mt-2">{{ $t->name }} — {{ $t->country }}</p>
            <p class="text-amber-500">{{ str_repeat('★', (int) ($t->rating ?? 0)) }}</p>
        </div>
        @endforeach
    </div>
</section>
@endsection
