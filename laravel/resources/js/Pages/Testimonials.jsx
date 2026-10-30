import AppLayout from '../Layouts/AppLayout';

export default function Testimonials({ testimonials }) {
    return (
        <AppLayout>
            <section className="py-12 container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-6">Témoignages</h1>
                <div className="grid md:grid-cols-2 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.id} className="border rounded-lg p-4">
                            <p className="text-gray-600 italic">"{t.text}"</p>
                            <p className="font-bold mt-2">{t.name} — {t.country}</p>
                            <p className="text-amber-500">{'★'.repeat(t.rating)}</p>
                        </div>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
}
