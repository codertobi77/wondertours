@extends('layouts.app')
@section('title','Accueil')
@section('content')

<section class="py-20 text-center bg-gradient-to-b from-amber-50 to-white">
    <h1 class="text-4xl font-bold mb-4">Découvrez le Bénin, le Togo et le Ghana</h1>
    <p class="text-gray-600 mb-8">Plus de 20 ans d'expertise touristique</p>
    <a href="/circuits" class="bg-amber-600 text-white px-6 py-3 rounded-full inline-block hover:bg-amber-700">Découvrir nos circuits</a>
</section>

<section class="py-12 container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-6">Nos circuits</h2>
    <div class="grid md:grid-cols-3 gap-6">
        @foreach($circuits as $c)
        <a href="/circuits/{{ $c->slug }}" class="border rounded-lg p-4 hover:shadow-lg transition bg-white block">
            <h3 class="font-bold">{{ $c->title }}</h3>
            <p class="text-sm text-gray-600">{{ optional($c->destination)->name ?? '' }}</p>
            <p class="text-amber-600 font-bold mt-2">{{ $c->price }} FCFA</p>
            <p class="text-xs text-gray-500 mt-1">{{ $c->duration }}</p>
        </a>
        @endforeach
    </div>
</section>

@if($testimonials->isNotEmpty())
<section class="py-12 container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-6">Témoignages</h2>
    <div class="grid md:grid-cols-2 gap-6">
        @foreach($testimonials as $t)
        <div class="border rounded-lg p-4 bg-white">
            <p class="text-gray-600 italic">"{{ $t->text }}"</p>
            <p class="font-bold mt-2">{{ $t->name }} — {{ $t->country }}</p>
        </div>
        @endforeach
    </div>
</section>
@endif

@if($posts->isNotEmpty())
<section class="py-12 container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-6">Blog</h2>
    <div class="grid md:grid-cols-3 gap-6">
        @foreach($posts as $p)
        <a href="/blog/{{ $p->slug }}" class="border rounded-lg p-4 bg-white block hover:shadow-lg transition">
            <h3 class="font-bold">{{ $p->title }}</h3>
            <p class="text-sm text-gray-600">{{ $p->excerpt }}</p>
        </a>
        @endforeach
    </div>
</section>
@endif

@if($services->isNotEmpty())
<section class="py-12 container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-6">Nos services</h2>
    <div class="grid md:grid-cols-3 gap-6">
        @foreach($services as $s)
        <div class="border rounded-lg p-4 bg-white">
            <h3 class="font-bold">{{ $s->title }}</h3>
            <p class="text-sm text-gray-600">{{ $s->description }}</p>
        </div>
        @endforeach
    </div>
</section>
@endif
@endsection
