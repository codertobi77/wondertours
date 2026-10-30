import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';

export default function BlogPost({ post }) {
    return (
        <AppLayout>
            <article className="py-12 container mx-auto px-4 max-w-3xl">
                <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                <p className="text-gray-500 text-sm mb-6">{post.publishedAt} — {post.category?.name}</p>
                <div className="prose" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                <Link href="/blog" className="text-amber-600 mt-6 inline-block">← Retour au blog</Link>
            </article>
        </AppLayout>
    );
}
