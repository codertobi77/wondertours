import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';

export default function Home({ circuits, testimonials, posts, services, destinations }) {
    return (
        <AppLayout>
            <section className="py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Découvrez le Bénin, le Togo et le Ghana</h1>
                <p className="text-gray-600 mb-8">Plus de 20 ans d'expertise touristique</p>
                <Link href="/circuits" className="bg-amber-600 text-white px-6 py-3 rounded-full">Découvrir nos circuits</Link>
            </section>
            <section className="py-12 container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6">Nos circuits</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {circuits.map((c) => (
                        <div key={c.id} className="border rounded-lg p-4">
                            <h3 className="font-bold">{c.title}</h3>
                            <p className="text-sm text-gray-600">{c.destination?.name}</p>
                            <p className="text-amber-600 font-bold mt-2">{c.price} FCFA</p>
                        </div>
                    ))}
                </div>
            </section>
            {testimonials.length > 0 && (
                <section className="py-12 container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-6">Témoignages</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {testimonials.map((t) => (
                            <div key={t.id} className="border rounded-lg p-4">
                                <p className="text-gray-600 italic">"{t.text}"</p>
                                <p className="font-bold mt-2">{t.name} - {t.country}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {posts.length > 0 && (
                <section className="py-12 container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-6">Blog</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {posts.map((p) => (
                            <div key={p.id} className="border rounded-lg p-4">
                                <h3 className="font-bold">{p.title}</h3>
                                <p className="text-sm text-gray-600">{p.excerpt}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </AppLayout>
    );
}
