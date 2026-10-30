@extends('layouts.app')
@section('title','Séjours')
@section('content')
<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
    <h5 class="uppercase tracking-widest text-amber-600 text-sm font-semibold mb-3">Organisation de séjour</h5>
    <h1 class="font-heading text-4xl font-bold text-text mb-6">Créez votre séjour sur mesure au Bénin, au Togo ou au Ghana</h1>
    <p class="text-text-secondary text-lg mb-8">Wonder Tours and Services vous accompagne dans la conception d'un séjour personnalisé : transport, hébergement, accompagnement, activités.</p>
  </div>
  <div class="container mx-auto px-4 lg:px-8">
    <div class="grid md:grid-cols-3 gap-8">
      @foreach ([
        ['01','Échange','Nous échangeons sur vos envies, budget et contraintes.'],
        ['02','Conception','Nous concevons un séjour personnalisé et adapté.'],
        ['03','Accompagnement','Nous vous accompagnons tout au long de votre séjour.'],
      ] as $s)
      <div class="bg-[#F8F6F0] rounded-2xl p-6 border-2 border-amber-500/20">
        <div class="text-3xl font-heading font-bold text-amber-600 mb-2">{{ $s[0] }}</div>
        <h3 class="font-heading text-xl font-bold mb-2">{{ $s[1] }}</h3>
        <p class="text-text-secondary text-sm">{{ $s[2] }}</p>
      </div>
      @endforeach
    </div>
    <div class="text-center mt-12">
      <a href="/contact" class="bg-amber-600 text-white px-8 py-3 rounded-full font-medium hover:bg-amber-700 transition">Planifier mon voyage</a>
    </div>
  </div>
</section>
@endsection
