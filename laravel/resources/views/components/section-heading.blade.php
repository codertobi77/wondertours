@if(isset($kicker) && $kicker)
    <p class="uppercase tracking-widest text-amber-600 text-sm font-semibold mb-3 text-center">{{ $kicker }}</p>
@endif
@if(isset($title) && $title)
    <h2 class="font-heading text-3xl md:text-4xl font-bold text-text {{ isset($class) ? $class : '' }} text-center">{{ $title }}</h2>
@endif
@if(isset($subtitle) && $subtitle)
    <p class="text-text-secondary mt-4 max-w-2xl mx-auto text-center">{{ $subtitle }}</p>
@endif
