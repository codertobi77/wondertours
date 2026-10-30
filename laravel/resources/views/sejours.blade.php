@extends('layouts.app')
@section('title','Séjours')
@section('content')

@component('components.hero', [
    'kicker' => 'ORGANISATION DE SÉJOUR',
    'title' => 'Créez votre séjour sur mesure au Bénin, au Togo ou au Ghana',
    'subtitle' => 'Wonder Tours and Services vous accompagne dans la conception d\'un séjour personnalisé : transport, hébergement, accompagnement, activités.',
    'image' => '/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg',
    'cta1Text' => 'Planifier mon voyage',
    'cta1Href' => '/contact',
    'cta2Text' => 'Demander un devis',
    'cta2Href' => '/contact',
]) @endcomponent

<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8 max-w-4xl">
    <div class="text-center mb-12">
      @component('components.section-heading', ['title' => 'Notre méthode de conception']) @endcomponent
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      @foreach ([
        ['01','Échange','Nous échangeons sur vos envies, budget et contraintes.'],
        ['02','Conception','Nous concevons un séjour personnalisé et adapté.'],
        ['03','Accompagnement','Nous vous accompagnons tout au long de votre séjour.'],
      ] as $s)
      @component('components.card', ['class' => 'bg-[#F8F6F0] border-2 border-amber-500/20'])
        <div class="text-3xl font-heading font-bold text-amber-600 mb-2">{{ $s[0] }}</div>
        <h3 class="font-heading text-xl font-bold mb-2">{{ $s[1] }}</h3>
        <p class="text-text-secondary text-sm">{{ $s[2] }}</p>
      @endcomponent
      @endforeach
    </div>
  </div>
</section>

<section class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8 max-w-4xl">
    <div class="text-center mb-12">
      @component('components.section-heading', ['title' => 'Ce qui est inclus']) @endcomponent
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      @foreach ([
        'Transport tout au long du séjour',
        'Hébergement sélectionné',
        'Guide francophone expérimenté',
        'Visites et activités programmées',
        'Assistance 24/7 pendant le séjour',
        'Conseils et recommandations personnalisés',
      ] as $s)
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-amber-500/10">
        <svg class="w-8 h-8 text-amber-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <p class="text-text-secondary text-sm leading-relaxed">{{ $s }}</p>
      </div>
      @endforeach
    </div>
  </div>
</section>

<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8 max-w-2xl">
    <div class="text-center mb-8">
      @component('components.section-heading', ['title' => 'Planifier votre séjour']) @endcomponent
    </div>
    <form method="POST" action="/api/contact" class="bg-[#F8F6F0] p-8 rounded-2xl shadow-sm space-y-4">
      @csrf
      <input name="name" required placeholder="Nom complet" class="w-full border rounded-lg px-4 py-3">
      <input type="email" name="email" required placeholder="Email" class="w-full border rounded-lg px-4 py-3">
      <input type="tel" name="phone" placeholder="Téléphone / WhatsApp" class="w-full border rounded-lg px-4 py-3">
      <textarea name="message" rows="4" required placeholder="Vos envies de séjour..." class="w-full border rounded-lg px-4 py-3"></textarea>
      <button type="submit" class="w-full bg-amber-600 text-white py-3 rounded-full font-medium hover:bg-amber-700 transition">Envoyer ma demande</button>
    </form>
  </div>
</section>
@endsection
