<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Wonder Tours') - Wonder Tours and Services</title>
    @vite('resources/css/app.css')
    <style>
        body { font-family: 'Figtree', system-ui, sans-serif; }
    </style>
    @stack('head')
</head>
<body class="min-h-screen flex flex-col bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
        <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" class="font-bold text-xl text-amber-700">Wonder Tours</a>
            <div class="flex gap-5 text-sm font-medium">
                <a href="/circuits" class="hover:text-amber-700">Circuits</a>
                <a href="/blog" class="hover:text-amber-700">Blog</a>
                <a href="/temoignages" class="hover:text-amber-700">Témoignages</a>
                <a href="/a-propos" class="hover:text-amber-700">À propos</a>
                <a href="/contact" class="hover:text-amber-700">Contact</a>
                <a href="/dashboard" class="hover:text-amber-700">Dashboard</a>
            </div>
        </nav>
    </header>
    <main class="flex-1">
        @yield('content')
    </main>
    <footer class="bg-gray-100 py-8 text-center text-sm text-gray-600 mt-12">
        &copy; {{ date('Y') }} Wonder Tours and Services - Découvrez le Bénin, le Togo et le Ghana.
    </footer>
    @stack('scripts')
</body>
</html>
