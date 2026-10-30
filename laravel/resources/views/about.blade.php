@extends('layouts.app')
@section('title','À propos')
@section('content')

<section class="relative bg-[#17221F] text-white py-20">
  <div class="absolute inset-0">
    <img src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg" alt="" class="h-full w-full object-cover opacity-40">
    <div class="absolute inset-0 bg-black/60"></div>
  </div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    @component('components.section-heading', ['kicker' => 'À PROPOS', 'title' => 'À propos de Wonder Tours and Services', 'subtitle' => 'Plus de 20 ans d\'expertise au service de vos voyages au Bénin, au Togo et au Ghana', 'class' => 'text-white']) @endcomponent
  </div>
</section>

<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
    <div class="space-y-4">
      @component('components.section-heading', ['title' => 'Une équipe qui connaît le terrain']) @endcomponent
      <p class="text-text-secondary leading-relaxed">Wonder Tours and Services organise des séjours, visites culturelles et circuits au Bénin, au Togo et au Ghana. Notre expérience locale nous permet d'offrir des expériences authentiques et personnalisées à chaque voyageur.</p>
      <p class="text-text-secondary leading-relaxed">D'Ouidah à Abomey, de Lomé à Kumasi, découvrez des pays riches en histoire, en culture et en paysages exceptionnels.</p>
    </div>
    @component('components.card', ['class' => 'max-w-md mx-auto overflow-hidden']) <img src="/photos_site wonder_tours/FB_IMG_1766953938984.jpg" alt="Notre équipe" class="w-full"> @endcomponent
  </div>
</section>
@endsection
