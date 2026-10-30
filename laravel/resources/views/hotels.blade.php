@extends('layouts.app')
@section('title','Hôtels')
@section('content')
<section class="relative bg-[#17221F] text-white py-20">
  <img src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg" alt="" class="absolute inset-0 w-full h-full object-cover opacity-40">
  <div class="absolute inset-0 bg-black/60"></div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    <h5 class="uppercase tracking-widest text-amber-400 text-sm font-semibold mb-3">RÉSERVATION D'HÔTELS</h5>
    <h1 class="font-heading text-4xl font-bold mb-4">Trouvez votre hébergement au Bénin, au Togo ou au Ghana</h1>
    <p class="text-gray-200 mb-6">Nous vous aidons à trouver et réserver l'hébergement parfait pour votre séjour, selon vos préférences et votre budget.</p>
    <a href="#form" class="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-medium transition">Faire une demande</a>
  </div>
</section>
<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
    <h2 class="font-heading text-3xl font-bold text-text mb-4">Notre service d'assistance hôtelière</h2>
    <p class="text-text-secondary text-xl leading-relaxed mb-8">Un conseiller Wonder Tours and Services vous accompagnera dans votre recherche d'hébergement pour trouver l'hôtel idéal adapté à vos besoins, votre budget et vos préférences.</p>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-[#F8F6F0] p-6 rounded-xl"><p class="font-medium">Sélection d'hôtels de qualité</p></div>
      <div class="bg-[#F8F6F0] p-6 rounded-xl"><p class="font-medium">Meilleurs tarifs négociés</p></div>
      <div class="bg-[#F8F6F0] p-6 rounded-xl"><p class="font-medium">Assistance personnalisée</p></div>
    </div>
  </div>
</section>
<section id="form" class="py-20 bg-[#F8F6F0]">
  <div class="container mx-auto px-4 lg:px-8 max-w-2xl">
    <h2 class="font-heading text-3xl font-bold text-text mb-6 text-center">Faites une demande de réservation</h2>
    <form method="POST" action="/api/contact" class="bg-white p-8 rounded-2xl shadow-lg space-y-4">
      @csrf
      <input name="name" required placeholder="Nom complet" class="w-full border rounded-lg px-4 py-3">
      <input type="email" name="email" required placeholder="Email" class="w-full border rounded-lg px-4 py-3">
      <input type="tel" name="phone" required placeholder="Téléphone / WhatsApp" class="w-full border rounded-lg px-4 py-3">
      <select name="accommodationType" required class="w-full border rounded-lg px-4 py-3">
        <option value="">Sélectionnez un type</option>
        <option>Hôtel</option><option>Guesthouse</option><option>Resort</option><option>Villa</option>
      </select>
      <textarea name="message" rows="4" class="w-full border rounded-lg px-4 py-3" placeholder="Préférences, besoins spécifiques..."></textarea>
      <button type="submit" class="w-full bg-amber-600 text-white py-3 rounded-full font-medium hover:bg-amber-700 transition">Envoyer ma demande</button>
    </form>
  </div>
</section>
@endsection
