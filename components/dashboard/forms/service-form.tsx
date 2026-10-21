"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";
import { TranslateButton } from "@/components/dashboard/translate-button";

/** Données de préremplissage en mode édition. */
export interface ServiceFormInitial {
  id: string;
  title: string;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  icon?: string | null;
  href?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

/** Préremplissage depuis un service existant (ou formulaire vierge). */
function toFormState(initial?: ServiceFormInitial) {
  return {
    title: initial?.title ?? "",
    titleEn: initial?.titleEn ?? "",
    description: initial?.description ?? "",
    descriptionEn: initial?.descriptionEn ?? "",
    icon: initial?.icon ?? "",
    href: initial?.href ?? "",
    sortOrder: initial?.sortOrder != null ? String(initial.sortOrder) : "0",
    isActive: initial?.isActive ?? true,
  };
}

type FormState = ReturnType<typeof toFormState>;

export function ServiceForm({ initial }: { initial?: ServiceFormInitial }) {
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
    if (form.title.trim().length < 2) {
      setError("Le titre (FR) est requis (2 caractères minimum).");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        isEdit
          ? `/api/dashboard/services/${initial!.id}`
          : "/api/dashboard/services",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            titleEn: form.titleEn || null,
            description: form.description || null,
            descriptionEn: form.descriptionEn || null,
            icon: form.icon || null,
            href: form.href || null,
            sortOrder: Number(form.sortOrder || 0),
            isActive: form.isActive,
          }),
        }
      );
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.push("/dashboard/services");
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
          <Button variant="ghost" href="/dashboard/services">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Modifier le service" : "Nouveau service"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Mettez à jour le service proposé"
                : "Ajoutez un nouveau service proposé"}
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
                label="Titre (FR) *"
                placeholder="Circuits touristiques"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
              <Input
                label="Titre (EN)"
                placeholder="Tourist circuits"
                value={form.titleEn}
                onChange={(e) => update("titleEn", e.target.value)}
              />
              <Textarea
                label="Description (FR)"
                rows={4}
                placeholder="Découvrez nos circuits touristiques..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
              <Textarea
                label="Description (EN)"
                rows={4}
                value={form.descriptionEn}
                onChange={(e) => update("descriptionEn", e.target.value)}
              />
              <TranslateButton
                fields={{ title: form.title, description: form.description }}
                onTranslated={(texts) =>
                  setForm((prev) => ({
                    ...prev,
                    titleEn: texts.title ?? prev.titleEn,
                    descriptionEn: texts.description ?? prev.descriptionEn,
                  }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lien</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                label="Lien (URL)"
                placeholder="/circuits"
                value={form.href}
                onChange={(e) => update("href", e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Icône</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Icône"
                options={[
                  { value: "", label: "Sélectionner une icône" },
                  { value: "map", label: "Map (Carte)" },
                  { value: "calendar", label: "Calendar (Calendrier)" },
                  { value: "building-2", label: "Building (Hôtel)" },
                  { value: "user", label: "User (Guide)" },
                  { value: "car", label: "Car (Transport)" },
                  { value: "plane", label: "Plane (Vol)" },
                  { value: "utensils", label: "Utensils (Restauration)" },
                  { value: "camera", label: "Camera (Photographie)" },
                  { value: "music", label: "Music (Divertissement)" },
                  { value: "heart", label: "Heart (Bien-être)" },
                  { value: "star", label: "Star (Premium)" },
                ]}
                value={form.icon}
                onChange={(e) => update("icon", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Affichage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Ordre d'affichage"
                type="number"
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", e.target.value)}
              />
              <div className="flex items-center justify-between">
                <label htmlFor="service-active" className="text-sm font-medium text-gray-700">
                  Actif
                </label>
                <input
                  id="service-active"
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
