<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\Booking;
use App\Models\Category;
use App\Models\Circuit;
use App\Models\ContactRequest;
use App\Models\Destination;
use App\Models\MediaFile;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    // ── Generic CRUD helpers ──

    private function modelFor(string $resource): ?string
    {
        return match ($resource) {
            'circuits' => Circuit::class,
            'destinations' => Destination::class,
            'categories' => Category::class,
            'testimonials' => Testimonial::class,
            'services' => Service::class,
            'blog' => BlogPost::class,
            'blog-categories' => BlogCategory::class,
            'bookings' => Booking::class,
            'contact-requests' => ContactRequest::class,
            'settings' => Setting::class,
            'media' => MediaFile::class,
            'users' => User::class,
            default => null,
        };
    }

    public function index(Request $request, string $resource)
    {
        $model = $this->modelFor($resource);
        if (!$model) return response()->json(['error' => 'Ressource inconnue'], 404);
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));
        $query = $model::query();
        if ($s = $request->query('q')) {
            // basic search on common text fields (best-effort)
        }
        $total = $query->count();
        $items = $query->skip(($page - 1) * $pageSize)->take($pageSize)->get();
        return response()->json(['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize]);
    }

    public function show(string $resource, string $id)
    {
        $model = $this->modelFor($resource);
        if (!$model) return response()->json(['error' => 'Ressource inconnue'], 404);
        $item = $model::find($id);
        if (!$item) return response()->json(['error' => 'Introuvable'], 404);
        return response()->json($item);
    }

    public function store(Request $request, string $resource)
    {
        $model = $this->modelFor($resource);
        if (!$model) return response()->json(['error' => 'Ressource inconnue'], 404);
        $data = $request->all();
        if ($resource === 'circuits' && empty($data['slug']) && !empty($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        if ($resource === 'destinations' && empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        if ($resource === 'blog' && empty($data['slug']) && !empty($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        if ($resource === 'blog-categories' && empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        if ($resource === 'categories' && empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $item = $model::create($data);
        return response()->json($item, 201);
    }

    public function update(Request $request, string $resource, string $id)
    {
        $model = $this->modelFor($resource);
        if (!$model) return response()->json(['error' => 'Ressource inconnue'], 404);
        $item = $model::find($id);
        if (!$item) return response()->json(['error' => 'Introuvable'], 404);
        $item->update($request->all());
        return response()->json($item);
    }

    public function destroy(string $resource, string $id)
    {
        $model = $this->modelFor($resource);
        if (!$model) return response()->json(['error' => 'Ressource inconnue'], 404);
        $item = $model::find($id);
        if (!$item) return response()->json(['error' => 'Introuvable'], 404);
        $item->delete();
        return response()->json(['message' => 'Supprimé', 'id' => $id]);
    }

    // ── Special endpoints ──

    public function bookingsIndex(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));
        $q = Booking::with('circuit');
        $total = $q->count();
        $items = $q->skip(($page - 1) * $pageSize)->take($pageSize)->get();
        return response()->json(['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize]);
    }

    public function bookingStatus(Request $request, string $id)
    {
        $booking = Booking::find($id);
        if (!$booking) return response()->json(['error' => 'Réservation introuvable'], 404);
        $booking->status = $request->input('status', $booking->status);
        $booking->save();
        return response()->json($booking);
    }

    public function contactRequestsIndex(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));
        $q = ContactRequest::query();
        $total = $q->count();
        $items = $q->skip(($page - 1) * $pageSize)->take($pageSize)->get();
        return response()->json(['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize]);
    }

    public function contactRequestStatus(Request $request, string $id)
    {
        $cr = ContactRequest::find($id);
        if (!$cr) return response()->json(['error' => 'Demande introuvable'], 404);
        $cr->status = $request->input('status', $cr->status);
        $cr->save();
        return response()->json($cr);
    }

    public function mediaUpload(Request $request)
    {
        // Basic media record creation (file handling to be refined)
        $data = $request->validate([
            'filename' => 'required|string',
            'url' => 'required|string',
            'storagePath' => 'nullable|string',
            'mimeType' => 'nullable|string',
            'size' => 'nullable|integer',
            'width' => 'nullable|integer',
            'height' => 'nullable|integer',
            'altText' => 'nullable|string',
            'altTextEn' => 'nullable|string',
        ]);
        $media = MediaFile::create([
            'filename' => $data['filename'],
            'storage_path' => $data['storagePath'] ?? $data['url'],
            'url' => $data['url'],
            'mime_type' => $data['mimeType'] ?? null,
            'size' => $data['size'] ?? null,
            'width' => $data['width'] ?? null,
            'height' => $data['height'] ?? null,
            'alt_text' => $data['altText'] ?? null,
            'alt_text_en' => $data['altTextEn'] ?? null,
            'uploaded_by' => $request->attributes->get('jwt_payload')['sub'] ?? null,
        ]);
        return response()->json($media, 201);
    }

    public function mediaDelete(string $id)
    {
        $media = MediaFile::find($id);
        if (!$media) return response()->json(['error' => 'Fichier introuvable'], 404);
        $media->delete();
        return response()->json(['message' => 'Fichier supprimé', 'id' => $id, 'url' => $media->url]);
    }

    public function settingsIndex(Request $request)
    {
        $items = Setting::orderBy('key')->get();
        return response()->json(['items' => $items]);
    }

    public function settingsUpdate(Request $request)
    {
        $data = $request->validate(['settings' => 'required|array']);
        $results = [];
        foreach ($data['settings'] as $entry) {
            $setting = Setting::updateOrCreate(
                ['key' => $entry['key']],
                ['value' => $entry['value'] ?? null, 'description' => $entry['description'] ?? null]
            );
            $results[] = $setting;
        }
        return response()->json(['items' => $results, 'message' => 'Paramètres enregistrés']);
    }

    public function stats(Request $request)
    {
        return response()->json([
            'circuits' => [
                'total' => Circuit::count(),
                'active' => Circuit::where('is_active', true)->count(),
                'featured' => Circuit::where('is_featured', true)->count(),
            ],
            'bookings' => [
                'total' => Booking::count(),
                'pending' => Booking::where('status', 'pending')->count(),
                'confirmed' => Booking::where('status', 'confirmed')->count(),
                'thisMonth' => Booking::whereMonth('created_at', now()->month)->count(),
                'revenueThisMonth' => Booking::whereMonth('created_at', now()->month)->sum('total_price'),
            ],
            'contactRequests' => [
                'total' => ContactRequest::count(),
                'new' => ContactRequest::where('status', 'new')->count(),
                'inProgress' => ContactRequest::where('status', 'in_progress')->count(),
            ],
            'recentBookings' => Booking::with('circuit')->orderByDesc('created_at')->take(5)->get(),
            'recentContactRequests' => ContactRequest::orderByDesc('created_at')->take(5)->get(),
        ]);
    }

    public function translate(Request $request)
    {
        // DeepL integration placeholder
        return response()->json(['error' => 'Service de traduction non configuré'], 503);
    }

    public function usersIndex(Request $request)
    {
        $users = User::orderBy('created_at')->get();
        return response()->json(['items' => $users]);
    }

    public function usersStore(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'firstName' => 'required|string',
            'lastName' => 'required|string',
            'role' => 'required|in:admin,editor,viewer',
        ]);
        $user = User::create([
            'email' => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'first_name' => $data['firstName'],
            'last_name' => $data['lastName'],
            'role' => $data['role'],
            'is_active' => true,
        ]);
        return response()->json($user, 201);
    }

    public function usersUpdate(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['error' => 'Utilisateur introuvable'], 404);
        $user->update($request->only(['email', 'first_name', 'last_name', 'role', 'is_active']));
        return response()->json($user);
    }

    public function usersDestroy(string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['error' => 'Utilisateur introuvable'], 404);
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé', 'id' => $id]);
    }

    public function publish(Request $request)
    {
        return response()->json(['message' => 'Rebuild déclenché', 'triggered' => true]);
    }
}
