"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save, Star } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";
import { TranslateButton } from "@/components/dashboard/translate-button";

interface Option {
  value: string;
  label: string;
}

/** Données de préremplissage en mode édition. */
export interface TestimonialFormInitial {
  id: string;
  name: string;
  country?: string | null;
  rating?: number;
  text?: string;
  textEn?: string | null;
  circuitId?: string | null;
  avatarUrl?: string | null;
  /** Date ISO sérialisée — seul YYYY-MM-DD alimente <input type="date">. */
  date?: string | null;
  isVerified?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}

/** Préremplissage depuis un témoignage existant (ou formulaire vierge). */
function toFormState(initial?: TestimonialFormInitial) {
  return {
    name: initial?.name ?? "",
    country: initial?.country ?? "",
    rating: initial?.rating ?? 5,
    text: initial?.text ?? "",
    textEn: initial?.textEn ?? "",
    circuitId: initial?.circuitId ?? "",
    avatarUrl: initial?.avatarUrl ?? "",
    date: initial?.date ? initial.date.slice(0, 10) : "",
    isVerified: initial?.isVerified ?? false,
    isFeatured: initial?.isFeatured ?? false,
    isActive: initial?.isActive ?? true,
  };
}

type FormState = ReturnType<typeof toFormState>;

export function TestimonialForm({
  circuits,
  initial,
}: {
  circuits: Option[];
  initial?: TestimonialFormInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) {
      setError("Le nom est requis (2 caractères minimum).");
      return;
    }
    if (form.text.trim().length < 10) {
      setError("Le témoignage est requis (10 caractères minimum).");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        isEdit
          ? `/api/dashboard/testimonials/${initial!.id}`
          : "/api/dashboard/testimonials",
        {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          country: form.country || null,
          rating: form.rating,
          text: form.text,
          textEn: form.textEn || null,
          circuitId: form.circuitId || null,
          avatarUrl: form.avatarUrl || null,
          date: form.date || null,
          isVerified: form.isVerified,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        }),
        }
      );
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.push("/dashboard/testimonials");
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" href="/dashboard/testimonials">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Modifier le témoignage" : "Nouveau témoignage"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Mettez à jour le témoignage client"
                : "Ajoutez un nouveau témoignage client"}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          <Save className="w-4 h-4 mr-2" />
          {busy ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nom complet *"
                placeholder="Jean Dupont"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <Input
                label="Pays"
                placeholder="France"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />
              <Select
                label="Circuit / Service concerné"
                options={[{ value: "", label: "Sélectionner" }, ...circuits]}
                value={form.circuitId}
                onChange={(e) => update("circuitId", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenu du témoignage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => update("rating", star)}
                      className="focus:outline-none"
                      aria-label={`Note ${star} sur 5`}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= form.rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({form.rating}/5)</span>
                </div>
              </div>
              <Textarea
                label="Témoignage (FR) *"
                rows={6}
                placeholder="Excellent circuit ! Guide très professionnel et expériences authentiques."
                value={form.text}
                onChange={(e) => update("text", e.target.value)}
              />
              <Textarea
                label="Témoignage (EN)"
                rows={6}
                value={form.textEn}
                onChange={(e) => update("textEn", e.target.value)}
              />
              <TranslateButton
                fields={{ text: form.text }}
                onTranslated={(texts) =>
                  setForm((prev) => ({ ...prev, textEn: texts.text ?? prev.textEn }))
                }
              />
              <Input
                label="Date du voyage"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo du client</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                label="URL de la photo"
                placeholder="/uploads/exemple.jpg"
                value={form.avatarUrl}
                onChange={(e) => update("avatarUrl", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="testimonial-verified" className="text-sm font-medium text-gray-700">
                  Vérifié
                </label>
                <input
                  id="testimonial-verified"
                  type="checkbox"
                  className="rounded"
                  checked={form.isVerified}
                  onChange={(e) => update("isVerified", e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="testimonial-featured" className="text-sm font-medium text-gray-700">
                  À la une
                </label>
                <input
                  id="testimonial-featured"
                  type="checkbox"
                  className="rounded"
                  checked={form.isFeatured}
                  onChange={(e) => update("isFeatured", e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="testimonial-active" className="text-sm font-medium text-gray-700">
                  Actif
                </label>
                <input
                  id="testimonial-active"
                  type="checkbox"
                  className="rounded"
                  checked={form.isActive}
                  onChange={(e) => update("isActive", e.target.checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
