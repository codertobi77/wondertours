@extends('layouts.app')
@section('title','À propos')
@section('content')

<section class="relative bg-[#17221F] text-white py-20">
  <div class="absolute inset-0">
    <img src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg" alt="" class="h-full w-full object-cover opacity-40">
    <div class="absolute inset-0 bg-black/60"></div>
  </div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    <h5 class="uppercase tracking-widest text-amber-400 text-sm font-semibold mb-3">À PROPOS</h5>
    <h1 data-i18n="about.page" class="font-heading text-4xl md:text-5xl font-bold mb-4">À propos de Wonder Tours and Services</h1>
    <p class="text-gray-200 text-lg">Plus de 20 ans d'expertise au service de vos voyages au Bénin, au Togo et au Ghana.</p>
  </div>
</section>

<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="font-heading text-3xl font-bold text-text mb-4">Une équipe qui connaît le terrain</h2>
        <p class="text-text-secondary leading-relaxed mb-4">Wonder Tours and Services organise des séjours, visites culturelles et circuits au Bénin, au Togo et au Ghana. Notre expérience locale nous permet d'offrir des expériences authentiques et personnalisées à chaque voyageur.</p>
        <p class="text-text-secondary leading-relaxed">D'Ouidah à Abomey, de Lomé à Kumasi, découvrez des pays riches en histoire, en culture et en paysages exceptionnels.</p>
      </div>
      <div class="max-w-md mx-auto">
        <img src="/photos_site wonder_tours/FB_IMG_1766953938984.jpg" alt="Notre équipe" class="rounded-2xl shadow-2xl w-full">
      </div>
    </div>
  </div>
</section>

@if(!empty($founderBioFr))
<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8 max-w-3xl">
    <div class="bg-white p-8 rounded-2xl shadow-sm">
      <h2 class="font-heading text-2xl font-bold mb-4">Mots du fondateur</h2>
      <div class="prose max-w-none text-text-secondary">{!! $founderBioFr !!}</div>
    </div>
  </div>
</section>
@endif
@endsection
