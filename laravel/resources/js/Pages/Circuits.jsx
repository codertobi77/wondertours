import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';

export default function Circuits({ circuits, destinations, categories }) {
    return (
        <AppLayout>
            <section className="py-12 container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-6">Nos circuits</h1>
                <div className="grid md:grid-cols-3 gap-6">
                    {circuits.map((c) => (
                        <Link key={c.id} href={`/circuits/${c.slug}`} className="border rounded-lg p-4 hover:shadow-lg transition">
                            <h3 className="font-bold">{c.title}</h3>
                            <p className="text-sm text-gray-600">{c.destination?.name}</p>
                            <p className="text-amber-600 font-bold mt-2">{c.price} FCFA</p>
                            <p className="text-xs text-gray-500 mt-1">{c.duration}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
}
