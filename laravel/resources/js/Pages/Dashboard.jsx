import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        fetch('/api/dashboard/stats').then(r => r.json()).then(setStats).catch(() => {});
    }, []);
    return (
        <div className="py-8 container mx-auto px-4">
            <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
            {stats && (
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="border rounded p-4">
                        <p className="text-sm text-gray-500">Circuits actifs</p>
                        <p className="text-2xl font-bold">{stats.circuits?.active ?? 0}</p>
                    </div>
                    <div className="border rounded p-4">
                        <p className="text-sm text-gray-500">Réservations</p>
                        <p className="text-2xl font-bold">{stats.bookings?.total ?? 0}</p>
                    </div>
                    <div className="border rounded p-4">
                        <p className="text-sm text-gray-500">Demandes de contact</p>
                        <p className="text-2xl font-bold">{stats.contactRequests?.total ?? 0}</p>
                    </div>
                </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
                <Link href="/dashboard/circuits" className="border rounded p-4 hover:shadow transition">Gérer les circuits</Link>
                <Link href="/dashboard/blog" className="border rounded p-4 hover:shadow transition">Gérer le blog</Link>
                <Link href="/dashboard/testimonials" className="border rounded p-4 hover:shadow transition">Gérer les témoignages</Link>
                <Link href="/dashboard/settings" className="border rounded p-4 hover:shadow transition">Paramètres</Link>
            </div>
        </div>
    );
}
