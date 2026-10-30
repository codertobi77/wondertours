@extends('layouts.app')
@section('title','À propos')
@section('content')

<section class="py-12 container mx-auto px-4 max-w-3xl">
    <h1 class="text-3xl font-bold mb-6">À propos</h1>
    <p class="text-gray-600 leading-relaxed">Wonder Tours and Services — plus de 20 ans d'expertise touristique au Bénin, au Togo et au Ghana.</p>
    @if(!empty($founderBioFr))
    <div class="mt-6 prose">{!! $founderBioFr !!}</div>
    @endif
</section>
@endsection
