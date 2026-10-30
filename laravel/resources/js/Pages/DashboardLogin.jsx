import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function DashboardLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/dashboard';
            } else {
                setError(data.error || 'Identifiants invalides');
            }
        } catch {
            setError('Erreur réseau');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
                <h1 className="text-2xl font-bold text-center mb-6">Connexion Dashboard</h1>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
                <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
                <button type="submit" disabled={loading} className="w-full bg-amber-600 text-white py-2 rounded disabled:opacity-50">{loading ? 'Connexion...' : 'Se connecter'}</button>
            </form>
        </div>
    );
}
