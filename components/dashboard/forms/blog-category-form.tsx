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
export interface BlogCategoryFormInitial {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

/** Préremplissage depuis une catégorie de blog existante (ou formulaire vierge). */
function toFormState(initial?: BlogCategoryFormInitial) {
  return {
    name: initial?.name ?? "",
    nameEn: initial?.nameEn ?? "",
    description: initial?.description ?? "",
    descriptionEn: initial?.descriptionEn ?? "",
    color: initial?.color ?? "#3B82F6",
    sortOrder: initial?.sortOrder != null ? String(initial.sortOrder) : "0",
    isActive: initial?.isActive ?? true,
  };
}

type FormState = ReturnType<typeof toFormState>;

export function BlogCategoryForm({
  initial,
}: {
  initial?: BlogCategoryFormInitial;
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
          ? `/api/dashboard/blog-categories/${initial!.id}`
          : "/api/dashboard/blog-categories",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            nameEn: form.nameEn || null,
            description: form.description || null,
            descriptionEn: form.descriptionEn || null,
            color: form.color || null,
            sortOrder: Number(form.sortOrder || 0),
            isActive: form.isActive,
          }),
        }
      );
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.push("/dashboard/blog-categories");
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
          <Button variant="ghost" href="/dashboard/blog-categories">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit
                ? "Modifier la catégorie de blog"
                : "Nouvelle catégorie de blog"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Mettez à jour la catégorie d'articles"
                : "Ajoutez une nouvelle catégorie d'articles de blog"}
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
                placeholder="Destinations"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <Input
                label="Nom (EN)"
                placeholder="Destinations"
                value={form.nameEn}
                onChange={(e) => update("nameEn", e.target.value)}
              />
              <Textarea
                label="Description (FR)"
                rows={4}
                placeholder="Articles sur les destinations du Bénin..."
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    aria-label="Choisir une couleur"
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    value={form.color}
                    onChange={(e) => update("color", e.target.value)}
                  />
                  <Input
                    placeholder="#3B82F6"
                    className="flex-1"
                    value={form.color}
                    onChange={(e) => update("color", e.target.value)}
                  />
                </div>
              </div>
              <Input
                label="Ordre d'affichage"
                type="number"
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", e.target.value)}
              />
              <div className="flex items-center justify-between">
                <label htmlFor="blog-category-active" className="text-sm font-medium text-gray-700">
                  Actif
                </label>
                <input
                  id="blog-category-active"
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
