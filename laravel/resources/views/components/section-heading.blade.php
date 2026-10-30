@if(isset($kicker) && $kicker)
    <p class="uppercase tracking-widest text-amber-600 text-sm font-semibold mb-3 text-center" @if(isset($i18nKicker)) data-i18n="{{ $i18nKicker }}" @endif>{{ $kicker }}</p>
@endif
@if(isset($title) && $title)
    <h2 class="font-heading text-3xl md:text-4xl font-bold text-text text-center" @if(isset($i18n)) data-i18n="{{ $i18n }}" @endif>{{ $title }}</h2>
@endif
@if(isset($subtitle) && $subtitle)
    <p class="text-text-secondary mt-4 max-w-2xl mx-auto text-center" @if(isset($i18nSub)) data-i18n="{{ $i18nSub }}" @endif>{{ $subtitle }}</p>
@endif
