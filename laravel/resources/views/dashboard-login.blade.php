@extends('layouts.app')
@section('title','Connexion Dashboard')
@section('content')

<div class="min-h-screen flex items-center justify-center">
    <form id="login-form" class="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
        <h1 class="text-2xl font-bold text-center mb-6">Connexion Dashboard</h1>
        <div id="login-error" class="text-red-600 text-sm hidden"></div>
        <input type="email" name="email" placeholder="Email" class="w-full border rounded px-3 py-2" required />
        <input type="password" name="password" placeholder="Mot de passe" class="w-full border rounded px-3 py-2" required />
        <button type="submit" id="login-btn" class="w-full bg-amber-600 text-white py-2 rounded disabled:opacity-50">Se connecter</button>
    </form>
</div>
<script>
document.getElementById('login-form').addEventListener('submit', async function(e){
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    const f = e.target;
    const body = { email: f.email.value, password: f.password.value };
    try {
        const res = await fetch('/api/auth/login', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
        const data = await res.json();
        if (res.ok) { window.location.href = '/dashboard'; }
        else {
            const e = document.getElementById('login-error'); e.classList.remove('hidden'); e.textContent = data.error || 'Identifiants invalides';
        }
    } catch { const e = document.getElementById('login-error'); e.classList.remove('hidden'); e.textContent = 'Erreur réseau'; }
    finally { btn.disabled = false; }
});
</script>
@endsection
