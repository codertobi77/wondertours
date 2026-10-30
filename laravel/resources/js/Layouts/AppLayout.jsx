import { Link } from '@inertiajs/react';

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-sm">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl">Wonder Tours</Link>
                    <div className="flex gap-4 text-sm">
                        <Link href="/circuits">Circuits</Link>
                        <Link href="/blog">Blog</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/a-propos">À propos</Link>
                    </div>
                </nav>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="bg-gray-100 py-8 text-center text-sm text-gray-600">
                © {new Date().getFullYear()} Wonder Tours and Services
            </footer>
        </div>
    );
}
