@if (isset($href) && $href)
    <a href="{{ $href }}" class="inline-block w-full text-center {{ isset($primary) && $primary ? 'bg-amber-600 text-white hover:bg-amber-700' : 'border border-amber-600 text-amber-600 hover:bg-amber-600/10' }} px-8 py-3 rounded-full font-medium transition {{ isset($class) ? $class : '' }}">{{ $text ?? $slot }}</a>
@else
    <button type="{{ $type ?? 'button' }}" class="{{ isset($primary) && $primary ? 'bg-amber-600 text-white hover:bg-amber-700' : 'border border-amber-600 text-amber-600 hover:bg-amber-600/10' }} px-8 py-3 rounded-full font-medium transition {{ isset($class) ? $class : '' }}" onclick="{{ $onClick ?? '' }}">{{ $text ?? $slot }}</button>
@endif
