import AppLayout from '../Layouts/AppLayout';
import { useState } from 'react';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const data = await res.json();
            setStatus(res.ok ? 'success' : 'error');
        } catch {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <section className="py-12 container mx-auto px-4 max-w-xl">
                <h1 className="text-3xl font-bold mb-6">Contact</h1>
                {status === 'success' && <p className="text-green-600 mb-4">Message envoyé avec succès.</p>}
                {status === 'error' && <p className="text-red-600 mb-4">Erreur lors de l'envoi.</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nom" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" required />
                    <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded px-3 py-2" required />
                    <textarea placeholder="Message" value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full border rounded px-3 py-2" rows={5} required />
                    <button type="submit" disabled={loading} className="bg-amber-600 text-white px-6 py-2 rounded-full disabled:opacity-50">{loading ? 'Envoi...' : 'Envoyer'}</button>
                </form>
            </section>
        </AppLayout>
    );
}
