@extends('layouts.app')
@section('title','Contact')
@section('content')

<section class="relative bg-[#17221F] text-white py-20">
  <div class="absolute inset-0">
    <img src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg" alt="" class="h-full w-full object-cover opacity-40">
    <div class="absolute inset-0 bg-black/60"></div>
  </div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    <h5 class="uppercase tracking-widest text-amber-400 text-sm font-semibold mb-3">Contact</h5>
    <h1 data-i18n="contact.page" class="font-heading text-4xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
    <p class="text-gray-200 text-lg">Une question, un projet de voyage ? Notre équipe vous répond.</p>
  </div>
</section>

<section class="py-20 bg-white">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
      <div class="space-y-4 text-text-secondary">
        <h2 class="font-heading text-2xl font-bold text-text mb-4">Nous sommes à votre écoute</h2>
        <p>Wonder Tours and Services, Cotonou, Bénin.</p>
        <p class="flex items-center gap-2"><svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> +229 01 65 00 00 00</p>
        <p class="flex items-center gap-2"><svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> contact@wondertoursandservices.com</p>
      </div>
      <div id="contact-wrap">
        <div id="contact-success" class="hidden text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h3 class="font-heading text-xl font-bold text-text mb-2">Message envoyé</h3>
          <p class="text-text-secondary">Nous vous répondons sous 24h.</p>
        </div>
        <form id="contact-form" class="bg-[#F8F6F0] p-8 rounded-2xl shadow-sm space-y-4">
          <input name="name" required placeholder="Nom complet" class="w-full border rounded-lg px-4 py-3">
          <input type="email" name="email" required placeholder="Email" class="w-full border rounded-lg px-4 py-3">
          <input type="tel" name="phone" placeholder="Téléphone / WhatsApp" class="w-full border rounded-lg px-4 py-3">
          <textarea name="message" rows="4" required placeholder="Votre message" class="w-full border rounded-lg px-4 py-3"></textarea>
          <button type="submit" id="contact-btn" class="w-full bg-amber-600 text-white py-3 rounded-full font-medium hover:bg-amber-700 transition">Envoyer</button>
          <div id="contact-msg" class="text-sm text-center hidden"></div>
        </form>
      </div>
    </div>
  </div>
</section>

<script>
document.getElementById('contact-form').addEventListener('submit', async function(e){
    e.preventDefault();
    const btn = document.getElementById('contact-btn');
    btn.disabled = true;
    const f = e.target;
    const body = { name: f.name.value, email: f.email.value, phone: f.phone.value, message: f.message.value };
    const msg = document.getElementById('contact-msg');
    msg.classList.remove('hidden');
    try {
        const res = await fetch('/api/contact', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
        const data = await res.json().catch(()=>({}));
        if (res.ok) {
            document.getElementById('contact-success').classList.remove('hidden');
            document.getElementById('contact-form').classList.add('hidden');
        } else {
            msg.className='text-sm text-center text-red-600';
            msg.textContent = data.error || 'Erreur lors de l\'envoi.';
        }
    } catch { msg.className='text-sm text-center text-red-600'; msg.textContent='Erreur réseau.'; }
    finally { btn.disabled = false; }
});
</script>
@endsection
