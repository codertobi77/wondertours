@extends('layouts.app')
@section('title','Contact')
@section('content')

<section class="py-12 container mx-auto px-4 max-w-xl">
    <h1 class="text-3xl font-bold mb-6">Contact</h1>
    <div id="contact-msg" class="mb-4 hidden"></div>
    <form id="contact-form" class="space-y-4">
        @csrf
        <input type="text" name="name" placeholder="Nom" class="w-full border rounded px-3 py-2" required />
        <input type="email" name="email" placeholder="Email" class="w-full border rounded px-3 py-2" required />
        <textarea name="message" placeholder="Message" class="w-full border rounded px-3 py-2" rows="5" required></textarea>
        <button type="submit" id="contact-btn" class="bg-amber-600 text-white px-6 py-2 rounded-full">Envoyer</button>
    </form>
</section>
<script>
document.getElementById('contact-form').addEventListener('submit', async function(e){
    e.preventDefault();
    const btn = document.getElementById('contact-btn');
    btn.disabled = true;
    const form = e.target;
    const body = { name: form.name.value, email: form.email.value, message: form.message.value };
    const box = document.getElementById('contact-msg');
    try {
        const res = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]').content}, body: JSON.stringify(body)});
        box.classList.remove('hidden');
        if (res.ok) {
            box.className = 'mb-4 text-green-600';
            box.textContent = 'Message envoyé avec succès.';
            form.reset();
        } else {
            box.className = 'mb-4 text-red-600';
            box.textContent = 'Erreur lors de l'envoi.';
        }
    } catch(err) {
        box.classList.remove('hidden');
        box.className = 'mb-4 text-red-600';
        box.textContent = 'Erreur réseau.';
    } finally {
        btn.disabled = false;
    }
});
</script>
@endsection
