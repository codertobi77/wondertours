"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";
import { TranslateButton } from "@/components/dashboard/translate-button";
import { splitTags } from "@/lib/format";

interface Option {
  value: string;
  label: string;
}

/** Données de préremplissage en mode édition. */
export interface BlogPostFormInitial {
  id: string;
  title: string;
  titleEn?: string | null;
  excerpt?: string | null;
  excerptEn?: string | null;
  content?: string | null;
  contentEn?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  tags?: string[];
  readTime?: number | null;
  isFeatured?: boolean;
}

/** Préremplissage depuis un article existant (ou formulaire vierge). */
function toFormState(initial?: BlogPostFormInitial) {
  return {
    title: initial?.title ?? "",
    titleEn: initial?.titleEn ?? "",
    excerpt: initial?.excerpt ?? "",
    excerptEn: initial?.excerptEn ?? "",
    content: initial?.content ?? "",
    contentEn: initial?.contentEn ?? "",
    categoryId: initial?.categoryId ?? "",
    imageUrl: initial?.imageUrl ?? "",
    tags: initial?.tags ? initial.tags.join(", ") : "",
    readTime: initial?.readTime != null ? String(initial.readTime) : "",
    isFeatured: initial?.isFeatured ?? false,
  };
}

type FormState = ReturnType<typeof toFormState>;

export function BlogPostForm({
  categories,
  initial,
}: {
  categories: Option[];
  initial?: BlogPostFormInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(isPublished: boolean) {
    setError(null);
    if (form.title.trim().length < 3) {
      setError("Le titre (FR) est requis (3 caractères minimum).");
      return;
    }
    if (form.content.trim().length < 10) {
      setError("Le contenu (FR) est requis (10 caractères minimum).");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        isEdit ? `/api/dashboard/blog/${initial!.id}` : "/api/dashboard/blog",
        {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          titleEn: form.titleEn || null,
          excerpt: form.excerpt || null,
          excerptEn: form.excerptEn || null,
          content: form.content,
          contentEn: form.contentEn || null,
          categoryId: form.categoryId || null,
          imageUrl: form.imageUrl || null,
          tags: splitTags(form.tags),
          readTime: form.readTime ? Number(form.readTime) : null,
          isFeatured: form.isFeatured,
          isPublished,
        }),
        }
      );
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.push("/dashboard/blog");
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" href="/dashboard/blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Modifier l'article" : "Nouvel article"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Mettez à jour l'article de blog"
                : "Créez un nouvel article de blog"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => submit(false)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Brouillon
          </Button>
          <Button type="submit" disabled={busy}>
            <Save className="w-4 h-4 mr-2" />
            {busy ? "Enregistrement…" : "Publier"}
          </Button>
        </div>
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
                placeholder="Découvrez l&apos;histoire des rois d&apos;Abomey"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
              <Input
                label="Titre (EN)"
                value={form.titleEn}
                onChange={(e) => update("titleEn", e.target.value)}
              />
              <Textarea
                label="Extrait (FR)"
                rows={3}
                placeholder="Un bref résumé de l&apos;article..."
                value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
              />
              <Textarea
                label="Extrait (EN)"
                rows={3}
                value={form.excerptEn}
                onChange={(e) => update("excerptEn", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Contenu (FR) *"
                rows={12}
                placeholder="Écrivez votre article ici..."
                value={form.content}
                onChange={(e) => update("content", e.target.value)}
              />
              <Textarea
                label="Contenu (EN)"
                rows={12}
                value={form.contentEn}
                onChange={(e) => update("contentEn", e.target.value)}
              />
              <TranslateButton
                fields={{
                  title: form.title,
                  excerpt: form.excerpt,
                  content: form.content,
                }}
                onTranslated={(texts) =>
                  setForm((prev) => ({
                    ...prev,
                    titleEn: texts.title ?? prev.titleEn,
                    excerptEn: texts.excerpt ?? prev.excerptEn,
                    contentEn: texts.content ?? prev.contentEn,
                  }))
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Catégorie"
                options={[{ value: "", label: "Sélectionner" }, ...categories]}
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
              />
              <Input
                label="URL de l'image de couverture"
                placeholder="/uploads/exemple.jpg"
                value={form.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
              />
              <Input
                label="Tags (séparés par des virgules)"
                placeholder="histoire, abomey, culture, bénin"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
              />
              <Input
                label="Temps de lecture (minutes)"
                type="number"
                placeholder="5"
                value={form.readTime}
                onChange={(e) => update("readTime", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <label htmlFor="blog-featured" className="text-sm font-medium text-gray-700">
                  À la une
                </label>
                <input
                  id="blog-featured"
                  type="checkbox"
                  className="rounded"
                  checked={form.isFeatured}
                  onChange={(e) => update("isFeatured", e.target.checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
