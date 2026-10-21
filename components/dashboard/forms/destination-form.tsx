"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";
import { TranslateButton } from "@/components/dashboard/translate-button";

/** Données de préremplissage en mode édition. */
export interface DestinationFormInitial {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  country?: string | null;
  region?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

/** Préremplissage depuis une destination existante (ou formulaire vierge). */
function toFormState(initial?: DestinationFormInitial) {
  return {
    name: initial?.name ?? "",
    nameEn: initial?.nameEn ?? "",
    description: initial?.description ?? "",
    descriptionEn: initial?.descriptionEn ?? "",
    country: initial?.country ?? "",
    region: initial?.region ?? "",
    imageUrl: initial?.imageUrl ?? "",
    isActive: initial?.isActive ?? true,
  };
}

type FormState = ReturnType<typeof toFormState>;

export function DestinationForm({
  initial,
}: {
  initial?: DestinationFormInitial;
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
      setError("Le nom (FR) est requis (2 caractères minimum).");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        isEdit
          ? `/api/dashboard/destinations/${initial!.id}`
          : "/api/dashboard/destinations",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            nameEn: form.nameEn || null,
            description: form.description || null,
            descriptionEn: form.descriptionEn || null,
            country: form.country || null,
            region: form.region || null,
            imageUrl: form.imageUrl || null,
            isActive: form.isActive,
          }),
        }
      );
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.push("/dashboard/destinations");
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
          <Button variant="ghost" href="/dashboard/destinations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Modifier la destination" : "Nouvelle destination"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Mettez à jour la destination touristique"
                : "Ajoutez une nouvelle destination touristique"}
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
              <CardTitle>Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nom (FR) *"
                placeholder="Ouidah"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <Input
                label="Nom (EN)"
                placeholder="Ouidah"
                value={form.nameEn}
                onChange={(e) => update("nameEn", e.target.value)}
              />
              <Textarea
                label="Description (FR)"
                rows={6}
                placeholder="Description complète de la destination..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
              <Textarea
                label="Description (EN)"
                rows={6}
                value={form.descriptionEn}
                onChange={(e) => update("descriptionEn", e.target.value)}
              />
              <TranslateButton
                fields={{ name: form.name, description: form.description }}
                onTranslated={(texts) =>
                  setForm((prev) => ({
                    ...prev,
                    nameEn: texts.name ?? prev.nameEn,
                    descriptionEn: texts.description ?? prev.descriptionEn,
                  }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Pays"
                placeholder="Bénin"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />
              <Input
                label="Région"
                placeholder="Atlantique"
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                label="URL de l'image"
                placeholder="/uploads/exemple.jpg"
                value={form.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <label htmlFor="destination-active" className="text-sm font-medium text-gray-700">
                  Actif
                </label>
                <input
                  id="destination-active"
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
