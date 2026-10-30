<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Circuit;
use App\Models\Destination;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicController extends Controller
{
    private function paginate($query, Request $request): array
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));
        $total = $query->count();
        $items = $query->skip(($page - 1) * $pageSize)->take($pageSize)->get();
        return ['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize];
    }

    public function circuits(Request $request)
    {
        $q = Circuit::with(['destination', 'categories'])->where('is_active', true);
        if ($s = $request->query('q')) {
            $q->where(function ($w) use ($s) {
                $w->where('title', 'ilike', "%$s%")->orWhere('description', 'ilike', "%$s%");
            });
        }
        if ($dest = $request->query('destination')) {
            $q->whereHas('destination', fn ($w) => $w->where('slug', $dest));
        }
        if ($cat = $request->query('category')) {
            $q->whereHas('categories', fn ($w) => $w->where('slug', $cat));
        }
        if ($request->query('featured') === 'true') {
            $q->where('is_featured', true);
        }
        if ($maxPrice = $request->query('maxPrice')) {
            $q->where('price', '<=', (float) $maxPrice);
        }
        if ($maxDuration = $request->query('maxDuration')) {
            $q->where('duration_days', '<=', (int) $maxDuration);
        }
        $q->orderByDesc('is_featured')->orderByDesc('created_at');
        return response()->json($this->paginate($q, $request));
    }

    public function circuitBySlug(string $slug)
    {
        $circuit = Circuit::with(['destination', 'categories'])
            ->where('slug', $slug)->where('is_active', true)->first();
        if (!$circuit) {
            return response()->json(['error' => 'Circuit introuvable'], 404);
        }
        return response()->json($circuit);
    }

    public function destinations(Request $request)
    {
        $q = Destination::where('is_active', true)->orderBy('name');
        if ($s = $request->query('q')) {
            $q->where('name', 'ilike', "%$s%")->orWhere('country', 'ilike', "%$s%");
        }
        return response()->json($this->paginate($q, $request));
    }

    public function categories(Request $request)
    {
        $q = Category::where('is_active', true)->orderBy('sort_order')->orderBy('name');
        if ($s = $request->query('q')) {
            $q->where('name', 'ilike', "%$s%");
        }
        return response()->json($this->paginate($q, $request));
    }

    public function services(Request $request)
    {
        $q = Service::where('is_active', true)->orderBy('sort_order')->orderBy('created_at');
        if ($s = $request->query('q')) {
            $q->where('title', 'ilike', "%$s%")->orWhere('description', 'ilike', "%$s%");
        }
        return response()->json($this->paginate($q, $request));
    }

    public function testimonials(Request $request)
    {
        $q = Testimonial::where('is_active', true)->orderByDesc('is_featured')->orderByDesc('date');
        if ($s = $request->query('q')) {
            $q->where('name', 'ilike', "%$s%")->orWhere('text', 'ilike', "%$s%");
        }
        return response()->json($this->paginate($q, $request));
    }

    public function blog(Request $request)
    {
        $q = BlogPost::with('category')->where('is_published', true);
        if ($s = $request->query('q')) {
            $q->where('title', 'ilike', "%$s%")->orWhere('excerpt', 'ilike', "%$s%");
        }
        if ($cat = $request->query('category')) {
            $q->whereHas('category', fn ($w) => $w->where('slug', $cat));
        }
        if ($request->query('featured') === 'true') {
            $q->where('is_featured', true);
        }
        $q->orderByDesc('is_featured')->orderByDesc('published_at');
        return response()->json($this->paginate($q, $request));
    }

    public function blogBySlug(string $slug)
    {
        $post = BlogPost::with('category')->where('slug', $slug)->where('is_published', true)->first();
        if (!$post) {
            return response()->json(['error' => 'Article introuvable'], 404);
        }
        $post->increment('views');
        return response()->json($post);
    }

    public function blogCategories(Request $request)
    {
        $q = BlogCategory::where('is_active', true)->orderBy('sort_order')->orderBy('name');
        return response()->json($this->paginate($q, $request));
    }

    public function settings(Request $request)
    {
        $whitelist = ['founder_bio_fr', 'founder_bio_en', 'site_name', 'site_description', 'contact_email', 'contact_phone', 'contact_address', 'social_facebook', 'social_instagram', 'social_youtube'];
        $q = Setting::whereIn('key', $whitelist);
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 100)));
        $total = $q->count();
        $items = $q->orderBy('key')->skip(($page - 1) * $pageSize)->take($pageSize)->get();
        return response()->json(['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize]);
    }

    public function contact(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:255',
            'requestType' => 'nullable|string',
            'travelDate' => 'nullable|date',
            'travelers' => 'nullable|integer',
            'message' => 'required|string|min:10',
        ]);
        // mapping sejour/autre → stay/other
        $typeMap = ['sejour' => 'stay', 'autre' => 'other', 'circuit' => 'circuit', 'stay' => 'stay', 'hotel' => 'hotel', 'info' => 'info', 'other' => 'other'];
        $rt = $typeMap[$data['requestType'] ?? 'info'] ?? 'info';
        $cr = \App\Models\ContactRequest::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'subject' => $data['subject'] ?? null,
            'request_type' => $rt,
            'travel_date' => $data['travelDate'] ?? null,
            'travelers' => $data['travelers'] ?? null,
            'message' => $data['message'],
            'status' => 'new',
        ]);
        return response()->json(['message' => 'Demande envoyée avec succès', 'id' => $cr->id], 201);
    }

    public function bookings(Request $request)
    {
        $data = $request->validate([
            'circuitId' => 'nullable|uuid',
            'type' => 'nullable|string|in:circuit,stay,hotel',
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:50',
            'travelDate' => 'nullable|date',
            'returnDate' => 'nullable|date',
            'participants' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);
        $circuit = null;
        if (!empty($data['circuitId'])) {
            $circuit = Circuit::where('id', $data['circuitId'])->where('is_active', true)->first();
            if (!$circuit) {
                return response()->json(['error' => 'Circuit introuvable'], 400);
            }
        }
        $participants = $data['participants'] ?? 1;
        $totalPrice = $circuit ? (float) $circuit->price * $participants : null;
        $ref = 'WT-' . strtoupper(substr(base_convert(random_int(0, 35 ** 6 - 1), 10, 36), 0, 6));
        while (strlen($ref) < 9) $ref .= '0';
        $booking = Booking::create([
            'booking_reference' => $ref,
            'type' => $data['type'] ?? ($circuit ? 'circuit' : 'stay'),
            'circuit_id' => $circuit?->id,
            'customer_name' => $data['name'],
            'customer_email' => $data['email'],
            'customer_phone' => $data['phone'] ?? null,
            'travel_date' => $data['travelDate'] ?? null,
            'return_date' => $data['returnDate'] ?? null,
            'participants' => $participants,
            'total_price' => $totalPrice,
            'currency' => 'XOF',
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);
        return response()->json([
            'message' => 'Réservation enregistrée avec succès',
            'id' => $booking->id,
            'bookingReference' => $booking->booking_reference,
            'totalPrice' => $booking->total_price,
            'currency' => $booking->currency,
            'status' => $booking->status,
        ], 201);
    }
}
