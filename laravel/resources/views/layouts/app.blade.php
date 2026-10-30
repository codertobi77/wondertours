<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Wonder Tours') - Wonder Tours and Services</title>
    <link rel="icon" type="image/png" href="/croquis.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap">
    @vite('resources/css/app.css')
    @stack('head')
</head>
<body class="min-h-full flex flex-col bg-[#F8F6F0] text-[#17221F]">
    <header id="site-header" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent">
        <nav class="container mx-auto px-4 lg:px-8">
            <div class="flex items-center justify-between h-20">
                <a href="/" class="flex items-center">
                    <img src="/Logo_wonder_blanc.png" alt="Wonder Tours and Services" class="h-16 w-auto">
                </a>
                <div class="hidden lg:flex items-center space-x-8" id="main-nav">
                                        <a href="/" data-i18n="nav.home" class="nav-link hover:text-white transition-colors font-medium text-white/80">Accueil</a>
                    <a href="/a-propos" data-i18n="nav.about" class="nav-link hover:text-white transition-colors font-medium text-white/80">À propos</a>
                    <a href="/circuits" data-i18n="nav.circuits" class="nav-link hover:text-white transition-colors font-medium text-white/80">Circuits</a>
                    <a href="/sejours" data-i18n="nav.sejours" class="nav-link hover:text-white transition-colors font-medium text-white/80">Séjours</a>
                    <a href="/hotels" data-i18n="nav.hotels" class="nav-link hover:text-white transition-colors font-medium text-white/80">Hôtels</a>
                    <a href="/temoignages" data-i18n="nav.temoignages" class="nav-link hover:text-white transition-colors font-medium text-white/80">Témoignages</a>
                    <a href="/blog" data-i18n="nav.blog" class="nav-link hover:text-white transition-colors font-medium text-white/80">Blog</a>
                    <a href="/contact" data-i18n="nav.contact" class="nav-link hover:text-white transition-colors font-medium text-white/80">Contact</a>
                </div>
                <div class="hidden lg:flex items-center space-x-4">
                    <button id="cart-btn" onclick="openCart()" class="relative flex items-center space-x-2 text-white hover:text-white/80 transition-all duration-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </button>
                </div>
                <div class="hidden lg:flex items-center space-x-2 pl-4 border-l border-white/30">
                    <button data-lang="fr" onclick="setLang('fr')" class="font-medium text-white font-bold lang-btn">FR</button>
                    <span class="text-white/70">|</span>
                    <button data-lang="en" onclick="setLang('en')" class="font-medium text-white/70 hover:text-white lang-btn">EN</button>
                </div>
                <div class="lg:hidden flex items-center space-x-3">
                    <button id="mobile-menu-btn" class="p-2 text-white" aria-label="Toggle menu">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Mobile menu -->
        <div id="mobile-menu" class="lg:hidden hidden bg-amber-50 border-t overflow-hidden">
            <nav class="container mx-auto px-4 py-6">
                <div class="flex flex-col space-y-2">
                    @foreach ([
                        ['/', 'Accueil'],
                        ['/a-propos', 'À propos'],
                        ['/circuits', 'Circuits'],
                        ['/sejours', 'Séjours'],
                        ['/hotels', 'Hôtels'],
                        ['/temoignages', 'Témoignages'],
                        ['/blog', 'Blog'],
                        ['/contact', 'Contact'],
                    ] as $item)
                        <a href="{{ $item[0] }}" class="font-medium py-3 px-4 rounded-lg transition-colors text-[#17221F] hover:bg-amber-100">{{ $item[1] }}</a>
                    @endforeach
                </div>
            </nav>
        </div>
    </header>

    <!-- Spacer for fixed header -->
    <div class="h-20"></div>

    <main class="flex-1">
        @yield('content')
    </main>

    <div id="cart-sidebar" class="fixed top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300">
        <div class="flex items-center justify-between p-4 border-b">
            <h3 class="font-heading text-lg font-bold text-text">Ma réservation</h3>
            <button onclick="closeCart()" class="p-2 text-text">&times;</button>
        </div>
        <div class="p-4 space-y-3">
            <div id="cart-body" class="text-text-secondary text-sm">Aucun circuit sélectionné.</div>
        </div>
    </div>
    <div id="cart-scrim" onclick="closeCart()" class="fixed inset-0 bg-black/40 z-40 hidden"></div>

    <footer class="bg-white text-[#17221F] mt-12">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                <div class="space-y-4">
                    <div class="flex items-center">
                        <img src="/Logo_wonder_origine.png" alt="Wonder Tours and Services" class="h-20 w-auto">
                    </div>
                    <p class="text-text-secondary text-sm leading-relaxed">Wonder Tours and Services — plus de 20 ans d'expertise touristique au Bénin, au Togo et au Ghana.</p>
                    <div class="flex space-x-4">
                        <a href="#" target="_blank" rel="noopener noreferrer" class="text-text-secondary hover:text-text transition-colors" aria-label="Facebook">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" class="text-text-secondary hover:text-text transition-colors" aria-label="Instagram">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                    </div>
                </div>
                <div>
                    <h3 class="font-heading font-semibold text-lg mb-4 text-[#FFA500]">Navigation</h3>
                    <ul class="space-y-2">
                        @foreach ([
                            ['/', 'Accueil'], ['/a-propos','À propos'], ['/circuits','Circuits'],
                            ['/sejours','Séjours'], ['/hotels','Hôtels'], ['/temoignages','Témoignages'],
                            ['/blog','Blog'], ['/contact','Contact'],
                        ] as $item)
                            <li><a href="{{ $item[0] }}" class="text-text-secondary hover:text-text transition-colors text-sm">{{ $item[1] }}</a></li>
                        @endforeach
                    </ul>
                </div>
                <div>
                    <h3 class="font-heading font-semibold text-lg mb-4 text-[#FFA500]">Services</h3>
                    <ul class="space-y-2">
                        <li><a href="/circuits" class="text-text-secondary hover:text-text transition-colors text-sm">Circuits touristiques</a></li>
                        <li><a href="/sejours" class="text-text-secondary hover:text-text transition-colors text-sm">Organisation de séjours</a></li>
                        <li><a href="/hotels" class="text-text-secondary hover:text-text transition-colors text-sm">Réservation d'hébergements</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-heading font-semibold text-lg mb-4 text-[#FFA500]">Contact</h3>
                    <ul class="space-y-3">
                        <li class="flex items-start space-x-3 text-text-secondary text-sm"><svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span>Cotonou, Bénin</span></li>
                        <li class="flex items-center space-x-3 text-text-secondary text-sm"><svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg><a href="tel:+2290165000000" class="hover:text-text transition-colors">+229 01 65 00 00 00</a></li>
                        <li class="flex items-center space-x-3 text-text-secondary text-sm"><svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg><a href="mailto:contact@wondertoursandservices.com" class="hover:text-text transition-colors">contact@wondertoursandservices.com</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-300 mt-8 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p class="text-text-secondary text-sm text-center md:text-left">&copy; <span id="yr"></span> Wonder Tours and Services. Tous droits réservés.</p>
                <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-center">
                    <a href="/mentions-legales" class="text-text-secondary hover:text-text transition-colors">Mentions légales</a>
                    <a href="/politique-confidentialite" class="text-text-secondary hover:text-text transition-colors">Politiques de confidentialité</a>
                </div>
            </div>
        </div>
    </footer>

    <a href="https://wa.me/22964325968" target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40" aria-label="WhatsApp">
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>

    <script>
        (function(){
            var footerYear = document.getElementById('yr');
            if (footerYear) footerYear.textContent = new Date().getFullYear();
            var header = document.getElementById('site-header');
            window.addEventListener('scroll', function(){
                if (window.scrollY > 50) header.classList.add('bg-amber-600/95','backdrop-blur-md');
                else { header.classList.remove('bg-amber-600/95','backdrop-blur-md'); }
            });
            var mobileBtn = document.getElementById('mobile-menu-btn');
            var mobileMenu = document.getElementById('mobile-menu');
            if(mobileBtn && mobileMenu){
                mobileBtn.addEventListener('click', function(){ mobileMenu.classList.toggle('hidden'); });
            }
            // shimmer progress bar
            if (header) { /* scrolled state already handled */ }
        })();
        // i18n minimal FR/EN avec dictionnaire de navigation
        const I18N = {
            fr: {
                'nav.home':'Accueil','nav.about':'À propos','nav.circuits':'Circuits','nav.sejours':'Séjours','nav.hotels':'Hôtels','nav.temoignages':'Témoignages','nav.blog':'Blog','nav.contact':'Contact',
                'hero.subtitle':'EXPLOREZ LE BÉNIN, LE TOGO ET LE GHANA AUTREMENT',
                'hero.title':'Découvrez le Bénin, le Togo et le Ghana à travers des expériences authentiques.',
                'hero.desc':'Avec plus de 20 ans d'expertise, Wonder Tours and Services vous accompagne dans la découverte du patrimoine culturel et naturel du Bénin, du Togo et du Ghana.',
                'hero.cta1':'Découvrir nos circuits','hero.cta2':'Planifier mon voyage',
                'experience.title':'20+ années d'expérience',
                'circuits.kicker':'Nos expériences incontournables','circuits.title':'Découvrez les destinations qui font la richesse du Bénin, du Togo et du Ghana','circuits.more':'Voir tous les circuits',
                'why.title':'Voyagez avec une équipe qui connaît le Bénin, le Togo et le Ghana',
                'dest.title':'Le Bénin, le Togo et le Ghana vous attendent',
                'test.title':'Ce que nos voyageurs disent',
                'footer.navigation':'Navigation','footer.services':'Services','footer.contact':'Contact',
                'circuits.page':'Circuits','blog.page':'Blog','contact.page':'Contact','about.page':'À propos','testim.page':'Témoignages',
                'sejours.page':'Séjours','hotels.page':'Hôtels'
            },
            en: {
                'nav.home':'Home','nav.about':'About','nav.circuits':'Tours','nav.sejours':'Stays','nav.hotels':'Hotels','nav.temoignages':'Testimonials','nav.blog':'Blog','nav.contact':'Contact',
                'hero.subtitle':'EXPLORE BENIN, TOGO AND GHANA DIFFERENTLY',
                'hero.title':'Discover Benin, Togo and Ghana through authentic experiences.',
                'hero.desc':'With over 20 years of expertise, Wonder Tours and Services accompanies you in discovering Benin's, Togo's and Ghana's cultural and natural heritage.',
                'hero.cta1':'Discover our tours','hero.cta2':'Plan my trip',
                'experience.title':'20+ years of experience',
                'circuits.kicker':'Our must-try experiences','circuits.title':'Discover the destinations that make Benin, Togo and Ghana so rich','circuits.more':'View all tours',
                'why.title':'Travel with a team that knows Benin, Togo and Ghana',
                'dest.title':'Benin, Togo and Ghana await you',
                'test.title':'What our travellers say','footer.navigation':'Navigation','footer.services':'Services','footer.contact':'Contact',
                'circuits.page':'Tours','blog.page':'Blog','contact.page':'Contact','about.page':'About','testim.page':'Testimonials',
                'sejours.page':'Stays','hotels.page':'Hotels'
            }
        };
        function setLang(lang) {
            localStorage.setItem('wt-locale', lang);
            const dict = I18N[lang];
            document.querySelectorAll('[data-i18n]').forEach(function(el) {
                const k = el.getAttribute('data-i18n');
                if (dict[k]) el.innerHTML = dict[k];
            });
            document.querySelectorAll('.lang-btn').forEach(function(b) {
                if (b.getAttribute('data-lang') === lang) {
                    b.classList.add('font-bold','text-white');
                    b.classList.remove('text-white/70');
                } else {
                    b.classList.remove('font-bold');
                    b.classList.add('text-white/70');
                }
            });
        }
        window.addEventListener('load', function() {
            setLang(localStorage.getItem('wt-locale') || 'fr');
        });
        window.openCart = function() {
            document.getElementById('cart-sidebar').classList.remove('translate-x-full');
            document.getElementById('cart-scrim').classList.remove('hidden');
        };
        window.closeCart = function() {
            document.getElementById('cart-sidebar').classList.add('translate-x-full');
            document.getElementById('cart-scrim').classList.add('hidden');
        };
    </script>
    @stack('scripts')
</body>
</html>
