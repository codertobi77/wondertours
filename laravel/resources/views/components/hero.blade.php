@props(['kicker', 'title', 'subtitle', 'image', 'cta1Text', 'cta1Href', 'cta2Text', 'cta2Href'])

<section class="relative bg-[#17221F] text-white py-20 min-h-[520px]">
  <div class="absolute inset-0">
    <img src="{{ $image ?? '/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg' }}" alt="" class="h-full w-full object-cover opacity-40">
    <div class="absolute inset-0 bg-black/60"></div>
  </div>
  <div class="relative z-10 container mx-auto px-4 lg:px-8 text-center max-w-3xl">
    @if($kicker)
      <h5 class="uppercase tracking-widest text-amber-400 text-sm font-semibold mb-3">{{ $kicker }}</h5>
    @endif
    <h1 class="font-heading text-4xl md:text-5xl font-bold text-white mb-4">{{ $title }}</h1>
    @if($subtitle)
      <p class="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">{{ $subtitle }}</p>
    @endif
    <div class="flex items-center justify-center gap-4 flex-wrap">
      @if($cta1Text && $cta1Href)
        <a href="{{ $cta1Href }}" class="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-medium transition">{{ $cta1Text }}</a>
      @endif
      @if($cta2Text && $cta2Href)
        <a href="{{ $cta2Href }}" class="border border-white text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition">{{ $cta2Text }}</a>
      @endif
    </div>
  </div>
</section>
