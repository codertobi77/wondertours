@extends('layouts.app')
@section('title','Dashboard')
@section('content')

<div class="py-6 container mx-auto px-4">
    <h1 class="text-2xl font-bold mb-6">Tableau de bord</h1>
    <div id="auth-banner" class="mb-4 text-gray-600">Chargement...</div>

    <div id="dash-stats" class="grid md:grid-cols-3 gap-4 mb-8"></div>

    <div class="grid md:grid-cols-2 gap-4 mb-8">
        <a href="#circuits" class="block border rounded p-4 hover:shadow transition bg-white">Gérer les circuits</a>
        <a href="#posts" class="block border rounded p-4 hover:shadow transition bg-white">Gérer le blog</a>
        <a href="#settings" class="block border rounded p-4 hover:shadow transition bg-white">Paramètres</a>
        <a href="#contact-requests" class="block border rounded p-4 hover:shadow transition bg-white">Demandes de contact</a>
    </div>

    <section id="sec-circuits" class="mb-10">
        <h2 class="text-xl font-bold mb-3">Circuits</h2>
        <div class="flex gap-3 mb-3">
            <button id="btn-circuit-new" class="bg-amber-600 text-white px-4 py-2 rounded">Nouveau circuit</button>
            <button id="btn-circuit-refresh" class="border px-4 py-2 rounded">Rafraîchir</button>
        </div>
        <div class="overflow-auto">
            <table class="min-w-full bg-white border text-sm">
                <thead class="bg-gray-100"><tr><th class="p-2">Titre</th><th class="p-2">Prix</th><th class="p-2">Actif</th><th class="p-2">Actions</th></tr></thead>
                <tbody id="circuits-tbody"></tbody>
            </table>
        </div>
    </section>

    <section id="sec-posts" class="mb-10">
        <h2 class="text-xl font-bold mb-3">Articles de blog</h2>
        <div class="overflow-auto">
            <table class="min-w-full bg-white border text-sm">
                <thead class="bg-gray-100"><tr><th class="p-2">Titre</th><th class="p-2">Statut</th></tr></thead>
                <tbody id="posts-tbody"></tbody>
            </table>
        </div>
    </section>

    <section id="sec-settings" class="mb-10">
        <h2 class="text-xl font-bold mb-3">Paramètres (fondation)</h2>
        <form id="settings-form" class="space-y-3 max-w-xl"></form>
    </section>

    <section id="sec-contact-requests" class="mb-10">
        <h2 class="text-xl font-bold mb-3">Demandes de contact</h2>
        <table class="min-w-full bg-white border text-sm">
            <thead class="bg-gray-100"><tr><th class="p-2">Nom</th><th class="p-2">Email</th><th class="p-2">Statut</th></tr></thead>
            <tbody id="cr-tbody"></tbody>
        </table>
    </section>

    <div id="modal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-auto">
            <h3 id="modal-title" class="text-lg font-bold mb-4"></h3>
            <div id="modal-form"></div>
        </div>
    </div>
</div>

<script>
const API = '/api';
async function api(path, opts = {}) {
    opts.credentials = 'include';
    opts.headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
    const res = await fetch(API + path, opts);
    if (res.status === 401) { window.location.href = '/dashboard/login'; throw new Error('unauth'); }
    return res;
}
async function loadMe() {
    try {
        const res = await api('/auth/me');
        if (!res.ok) throw new Error();
        const d = await res.json();
        const u = d.user || d;
        document.getElementById('auth-banner').textContent = 'Connecté : ' + (u.email || '') + ' (' + (u.role || '') + ')';
    } catch { window.location.href = '/dashboard/login'; }
}
async function loadStats() {
    try {
        const res = await api('/dashboard/stats');
        const d = await res.json();
        const c = document.getElementById('dash-stats');
        const items = [
            ['Circuits actifs', d.circuits?.active ?? 0],
            ['Réservations', d.bookings?.total ?? 0],
            ['Demandes de contact', d.contactRequests?.total ?? 0],
        ];
        c.innerHTML = items.map(([label,val]) => `<div class="border rounded p-4 bg-white"><p class="text-sm text-gray-500">${label}</p><p class="text-2xl font-bold">${val}</p></div>`).join('');
    } catch {}
}
async function loadCircuits() {
    const res = await api('/dashboard/circuits');
    const list = await res.json();
    const items = Array.isArray(list) ? list : (list.items || []);
    const tbody = document.getElementById('circuits-tbody');
    tbody.innerHTML = items.map(c => `<tr class="border-t">
        <td class="p-2">${c.title || ''}</td>
        <td class="p-2">${c.price ?? ''}</td>
        <td class="p-2">${c.isActive ? 'oui' : 'non'}</td>
        <td class="p-2 space-x-1">
            <button onclick="deleteCircuit('${c.id}')" class="text-red-600">Suppr.</button>
        </td>
    </tr>`).join('') || '<tr><td colspan="4" class="p-2 text-gray-500">Aucun circuit</td></tr>';
}
async function deleteCircuit(id) {
    if (!confirm('Supprimer ?')) return;
    await api('/dashboard/circuits/' + id, { method:'DELETE' });
    await loadCircuits();
}
async function loadPosts() {
    const res = await api('/dashboard/blog');
    const list = await res.json();
    const items = Array.isArray(list) ? list : (list.items || []);
    document.getElementById('posts-tbody').innerHTML = items.map(p => `<tr class="border-t"><td class="p-2">${p.title||''}</td><td class="p-2">${p.isPublished?'publié':'brouillon'}</td></tr>`).join('') || '<tr><td colspan="2" class="p-2 text-gray-500">Aucun article</td></tr>';
}
async function loadContactRequests() {
    const res = await api('/dashboard/contact-requests');
    const list = await res.json();
    const items = Array.isArray(list) ? list : (list.items || []);
    document.getElementById('cr-tbody').innerHTML = items.map(c => `<tr class="border-t"><td class="p-2">${c.name||''}</td><td class="p-2">${c.email||''}</td><td class="p-2">${c.status||''}</td></tr>`).join('') || '<tr><td colspan="3" class="p-2 text-gray-500">Aucune demande</td></tr>';
}
async function loadSettings() {
    const res = await api('/dashboard/settings');
    const list = await res.json();
    const items = Array.isArray(list) ? list : (list.items || []);
    const form = document.getElementById('settings-form');
    form.innerHTML = items.map(s => `<div><label class="block text-sm font-medium">${s.key}</label><input name="${s.key}" value="${(s.value||'').replace(/"/g,'&quot;')}" class="w-full border rounded px-3 py-2" /></div>`).join('') + '<button type="submit" class="bg-amber-600 text-white px-4 py-2 rounded">Enregistrer</button>';
    form.onsubmit = async (e) => { e.preventDefault(); /* best-effort */ alert('Paramètres chargés'); };
}
document.getElementById('btn-circuit-refresh').addEventListener('click', loadCircuits);
document.getElementById('btn-circuit-new').addEventListener('click', () => {
    const title = prompt('Titre du circuit ?');
    if (!title) return;
    api('/dashboard/circuits', { method:'POST', body: JSON.stringify({ title, slug: title.toLowerCase().replace(/\s+/g,'-'), is_active: true })}).then(_ => loadCircuits());
});
(async function init() {
    await loadMe();
    await loadStats();
    await loadCircuits();
    await loadPosts();
    await loadContactRequests();
    await loadSettings();
})();
</script>
@endsection
