import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';

export default function Blog({ posts, categories }) {
    return (
        <AppLayout>
            <section className="py-12 container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-6">Blog</h1>
                <div className="grid md:grid-cols-3 gap-6">
                    {posts.map((p) => (
                        <Link key={p.id} href={`/blog/${p.slug}`} className="border rounded-lg p-4 hover:shadow-lg transition">
                            <h3 className="font-bold">{p.title}</h3>
                            <p className="text-sm text-gray-600">{p.excerpt}</p>
                            <p className="text-xs text-gray-400 mt-2">{p.category?.name}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
}
