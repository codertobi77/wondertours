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
import {
  formatItineraryLines,
  joinLines,
  parseItineraryLines,
  splitLines,
} from "@/lib/format";

interface Option {
  value: string;
  label: string;
}

/**
 * Données de préremplissage en mode édition (objets JSON simples :
 * le Decimal Prisma est converti par la page serveur appelante).
 */
export interface CircuitFormInitial {
  id: string;
  title: string;
  titleEn?: string | null;
  subtitle?: string | null;
  subtitleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  destinationId?: string | null;
  categoryIds?: string[];
  durationDays?: number | null;
  durationNights?: number | null;
  price?: number | string;
  difficulty?: string | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
  imageUrl?: string | null;
  highlights?: string[];
  highlightsEn?: string[];
  itinerary?: { day: number; title: string; description: string }[];
  itineraryEn?: { day: number; title: string; description: string }[];
  included?: string[];
  includedEn?: string[];
  excluded?: string[];
  excludedEn?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
}

function optionalString(value: string | null | undefined): string {
  return value ?? "";
}

function optionalNumberField(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

/** Préremplissage depuis un enregistrement existant (ou formulaire vierge). */
function toFormState(initial?: CircuitFormInitial) {
  return {
    title: optionalString(initial?.title),
    titleEn: optionalString(initial?.titleEn),
    subtitle: optionalString(initial?.subtitle),
    subtitleEn: optionalString(initial?.subtitleEn),
    description: optionalString(initial?.description),
    descriptionEn: optionalString(initial?.descriptionEn),
    durationDays: optionalNumberField(initial?.durationDays),
    durationNights: optionalNumberField(initial?.durationNights),
    itinerary: initial?.itinerary ? formatItineraryLines(initial.itinerary) : "",
    itineraryEn: initial?.itineraryEn
      ? formatItineraryLines(initial.itineraryEn)
      : "",
    highlights: initial?.highlights ? joinLines(initial.highlights) : "",
    highlightsEn: initial?.highlightsEn ? joinLines(initial.highlightsEn) : "",
    included: initial?.included ? joinLines(initial.included) : "",
    includedEn: initial?.includedEn ? joinLines(initial.includedEn) : "",
    excluded: initial?.excluded ? joinLines(initial.excluded) : "",
    excludedEn: initial?.excludedEn ? joinLines(initial.excludedEn) : "",
    destinationId: optionalString(initial?.destinationId),
    categoryIds: initial?.categoryIds ?? [],
    price: initial?.price != null ? String(initial.price) : "",
    difficulty: initial?.difficulty ?? "moderate",
    minParticipants: optionalNumberField(initial?.minParticipants),
    maxParticipants: optionalNumberField(initial?.maxParticipants),
    imageUrl: optionalString(initial?.imageUrl),
    isFeatured: initial?.isFeatured ?? false,
    isActive: initial?.isActive ?? true,
  };
}

type FormState = ReturnType<typeof toFormState>;

export function CircuitForm({
  destinations,
  categories,
  initial,
}: {
  destinations: Option[];
  categories: Option[];
  initial?: CircuitFormInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /** (Dé)sélectionne une catégorie (multi-sélection m-n). */
  function toggleCategory(id: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      categoryIds: checked
        ? [...prev.categoryIds, id]
        : prev.categoryIds.filter((categoryId) => categoryId !== id),
    }));
  }

  function optionalNumber(value: string): number | null {
    return value.trim() ? Number(value) : null;
  }

  /**
   * Champs FR aplatis envoyés au bouton Traduire : textes simples + une
   * clé par ligne de points forts / programme / inclus / non inclus.
   */
  function translateFields(): Record<string, string> {
    const fields: Record<string, string> = {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
    };
    splitLines(form.highlights).forEach((line, index) => {
      fields[`highlight-${index}`] = line;
    });
    parseItineraryLines(form.itinerary).forEach((day, index) => {
      fields[`itinerary-${index}`] = day.description
        ? `${day.title} : ${day.description}`
        : day.title;
    });
    splitLines(form.included).forEach((line, index) => {
      fields[`included-${index}`] = line;
    });
    splitLines(form.excluded).forEach((line, index) => {
      fields[`excluded-${index}`] = line;
    });
    return fields;
  }

  /** Reconstitue les textareas EN depuis les clés traduites. */
  function applyTranslations(texts: Record<string, string>) {
    setForm((prev) => {
      const pickList = (prefix: string, source: string) => {
        const lines = splitLines(source);
        if (lines.length === 0 || texts[`${prefix}-0`] === undefined) return null;
        return lines
          .map((_, index) => texts[`${prefix}-${index}`] ?? "")
          .filter(Boolean)
          .join("\n");
      };
      const itineraryLines = parseItineraryLines(prev.itinerary).map((day) =>
        day.description ? `${day.title} : ${day.description}` : day.title
      );
      const itineraryEn =
        itineraryLines.length > 0 && texts["itinerary-0"] !== undefined
          ? itineraryLines
              .map((_, index) => texts[`itinerary-${index}`] ?? "")
              .filter(Boolean)
              .join("\n")
          : null;
      return {
        ...prev,
        titleEn: texts.title ?? prev.titleEn,
        subtitleEn: texts.subtitle ?? prev.subtitleEn,
        descriptionEn: texts.description ?? prev.descriptionEn,
        highlightsEn: pickList("highlight", prev.highlights) ?? prev.highlightsEn,
        itineraryEn: itineraryEn ?? prev.itineraryEn,
        includedEn: pickList("included", prev.included) ?? prev.includedEn,
        excludedEn: pickList("excluded", prev.excluded) ?? prev.excludedEn,
      };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Le titre (FR) est requis.");
      return;
    }
    if (form.price === "") {
      setError("Le prix est requis.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        isEdit
          ? `/api/dashboard/circuits/${initial!.id}`
          : "/api/dashboard/circuits",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            titleEn: form.titleEn || null,
            subtitle: form.subtitle || null,
            subtitleEn: form.subtitleEn || null,
            description: form.description || null,
            descriptionEn: form.descriptionEn || null,
            destinationId: form.destinationId || null,
            categoryIds: form.categoryIds,
            durationDays: optionalNumber(form.durationDays),
            durationNights: optionalNumber(form.durationNights),
            price: Number(form.price),
            difficulty: form.difficulty,
            minParticipants: optionalNumber(form.minParticipants),
            maxParticipants: optionalNumber(form.maxParticipants),
            imageUrl: form.imageUrl || null,
            highlights: splitLines(form.highlights),
            highlightsEn: splitLines(form.highlightsEn),
            itinerary: parseItineraryLines(form.itinerary),
            itineraryEn: parseItineraryLines(form.itineraryEn),
            included: splitLines(form.included),
            includedEn: splitLines(form.includedEn),
            excluded: splitLines(form.excluded),
            excludedEn: splitLines(form.excludedEn),
            isFeatured: form.isFeatured,
            isActive: form.isActive,
          }),
        }
      );
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.push("/dashboard/circuits");
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
          <Button variant="ghost" href="/dashboard/circuits">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Modifier le circuit" : "Nouveau circuit"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Mettez à jour les informations du circuit"
                : "Créez un nouveau circuit touristique"}
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
                placeholder="Circuit Ouidah - Route des Esclaves"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
              <Input
                label="Titre (EN)"
                placeholder="Ouidah Circuit - Slave Route"
                value={form.titleEn}
                onChange={(e) => update("titleEn", e.target.value)}
              />
              <Input
                label="Sous-titre (FR)"
                placeholder="Découvrez l'histoire de la traite des esclaves"
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
              <Input
                label="Sous-titre (EN)"
                value={form.subtitleEn}
                onChange={(e) => update("subtitleEn", e.target.value)}
              />
              <Textarea
                label="Description (FR)"
                rows={6}
                placeholder="Description complète du circuit..."
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
                fields={translateFields()}
                onTranslated={applyTranslations}
              />
              <p className="text-xs text-gray-500">
                Le bouton Traduire couvre tous les champs FR ci-dessus et
                ci-dessous (points forts, programme, inclus / non inclus) —
                envoyés par lots de 20 textes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itinéraire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Durée (jours)"
                  type="number"
                  placeholder="2"
                  value={form.durationDays}
                  onChange={(e) => update("durationDays", e.target.value)}
                />
                <Input
                  label="Durée (nuits)"
                  type="number"
                  placeholder="1"
                  value={form.durationNights}
                  onChange={(e) => update("durationNights", e.target.value)}
                />
              </div>
              <Textarea
                label="Programme détaillé FR (une ligne par jour, format « Titre : description »)"
                rows={8}
                placeholder={"Jour 1 : Visite du musée d'histoire\nJour 2 : Départ pour Ganvié"}
                value={form.itinerary}
                onChange={(e) => update("itinerary", e.target.value)}
              />
              <Textarea
                label="Programme détaillé EN (une ligne par jour, format « Title : description »)"
                rows={8}
                value={form.itineraryEn}
                onChange={(e) => update("itineraryEn", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Points forts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Points forts FR (un par ligne)"
                rows={4}
                placeholder={"Visite du musée d'histoire\nMarché des fétiches\nPlage de Grand-Popo"}
                value={form.highlights}
                onChange={(e) => update("highlights", e.target.value)}
              />
              <Textarea
                label="Points forts EN (un par ligne)"
                rows={4}
                value={form.highlightsEn}
                onChange={(e) => update("highlightsEn", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inclus / Non inclus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Services inclus FR (un par ligne)"
                rows={4}
                placeholder={"Transport climatisé\nGuide francophone\nHébergement"}
                value={form.included}
                onChange={(e) => update("included", e.target.value)}
              />
              <Textarea
                label="Services inclus EN (un par ligne)"
                rows={4}
                value={form.includedEn}
                onChange={(e) => update("includedEn", e.target.value)}
              />
              <Textarea
                label="Services non inclus FR (un par ligne)"
                rows={4}
                placeholder={"Billets d'avion\nAssurance voyage\nDépenses personnelles"}
                value={form.excluded}
                onChange={(e) => update("excluded", e.target.value)}
              />
              <Textarea
                label="Services non inclus EN (un par ligne)"
                rows={4}
                value={form.excludedEn}
                onChange={(e) => update("excludedEn", e.target.value)}
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
                label="Destination"
                options={[{ value: "", label: "Sélectionner" }, ...destinations]}
                value={form.destinationId}
                onChange={(e) => update("destinationId", e.target.value)}
              />
              <Input
                label="Prix (FCFA) *"
                type="number"
                placeholder="85000"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
              <Select
                label="Difficulté"
                options={[
                  { value: "easy", label: "Facile" },
                  { value: "moderate", label: "Modéré" },
                  { value: "challenging", label: "Difficile" },
                ]}
                value={form.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min. participants"
                  type="number"
                  placeholder="2"
                  value={form.minParticipants}
                  onChange={(e) => update("minParticipants", e.target.value)}
                />
                <Input
                  label="Max. participants"
                  type="number"
                  placeholder="20"
                  value={form.maxParticipants}
                  onChange={(e) => update("maxParticipants", e.target.value)}
                />
              </div>
              <Input
                label="URL de l'image principale"
                placeholder="/uploads/exemple.jpg"
                value={form.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catégories (plusieurs possibles)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.length === 0 && (
                <p className="text-sm text-gray-500">
                  Aucune catégorie — commencez par en créer une.
                </p>
              )}
              {categories.map((category) => (
                <label
                  key={category.value}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={form.categoryIds.includes(category.value)}
                    onChange={(e) => toggleCategory(category.value, e.target.checked)}
                  />
                  {category.label}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="circuit-active" className="text-sm font-medium text-gray-700">
                  Actif
                </label>
                <input
                  id="circuit-active"
                  type="checkbox"
                  className="rounded"
                  checked={form.isActive}
                  onChange={(e) => update("isActive", e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="circuit-featured" className="text-sm font-medium text-gray-700">
                  À la une
                </label>
                <input
                  id="circuit-featured"
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
