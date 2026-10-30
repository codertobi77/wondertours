@extends('layouts.app')
@section('title','Blog')
@section('content')

<section class="py-12 container mx-auto px-4">
    <h1 class="text-3xl font-bold mb-6">Blog</h1>
    <div class="grid md:grid-cols-3 gap-6">
        @foreach($posts as $p)
        <a href="/blog/{{ $p->slug }}" class="border rounded-lg p-4 bg-white hover:shadow-lg transition block">
            <h3 class="font-bold">{{ $p->title }}</h3>
            <p class="text-sm text-gray-600">{{ $p->excerpt }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ optional($p->category)->name ?? '' }}</p>
        </a>
        @endforeach
    </div>
</section>
@endsection
