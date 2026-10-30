"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Globe, Mail, Phone, MapPin, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";
import { ProgressBar } from "@/components/ui/progress-bar";

interface SettingField {
  key: string;
  label: string;
  icon?: LucideIcon;
  multiline?: boolean;
  /** Lignes du Textarea (multiligne uniquement) — défaut 3. */
  rows?: number;
}

/** Groupes affichés ; l'union des clés = celles envoyées au PUT groupé. */
const FIELD_GROUPS: { title: string; fields: SettingField[] }[] = [
  {
    title: "Informations du site",
    fields: [
      { key: "site_name", label: "Nom du site", icon: Globe },
      { key: "site_description", label: "Description", multiline: true },
    ],
  },
  {
    title: "Informations de contact",
    fields: [
      { key: "contact_email", label: "Email", icon: Mail },
      { key: "contact_phone", label: "Téléphone", icon: Phone },
      { key: "contact_address", label: "Adresse", icon: MapPin },
    ],
  },
  {
    title: "Réseaux sociaux",
    fields: [
      { key: "social_facebook", label: "Facebook" },
      { key: "social_instagram", label: "Instagram" },
      { key: "social_youtube", label: "YouTube" },
      { key: "whatsapp_number", label: "WhatsApp" },
    ],
  },
  {
    title: "Biographie du fondateur",
    fields: [
      {
        key: "founder_bio_fr",
        label: "Biographie — français",
        icon: User,
        multiline: true,
        rows: 6,
      },
      {
        key: "founder_bio_en",
        label: "Biographie — anglais",
        icon: User,
        multiline: true,
        rows: 6,
      },
    ],
  },
  {
    title: "SEO",
    fields: [{ key: "site_url", label: "URL du site", icon: Globe }],
  },
];

const ALL_KEYS = FIELD_GROUPS.flatMap((group) =>
  group.fields.map((field) => field.key)
);

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: ALL_KEYS.map((key) => {
            const value = values[key]?.trim();
            return { key, value: value ? value : null };
          }),
        }),
      });
      if (!response.ok) {
        setFeedback({ type: "error", message: await readApiError(response) });
        return;
      }
      setFeedback({ type: "success", message: "Paramètres enregistrés." });
    } catch {
      setFeedback({ type: "error", message: "Erreur réseau" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {FIELD_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor={field.key}
                  >
                    {field.icon && <field.icon className="w-4 h-4 inline mr-1" />}
                    {field.label}
                  </label>
                  {field.multiline ? (
                    <Textarea
                      id={field.key}
                      rows={field.rows ?? 3}
                      value={values[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      value={values[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <ProgressBar active={saving} label="Enregistrement en cours…" />

      {feedback && (
        <p
          className={
            feedback.type === "success"
              ? "text-sm text-green-600"
              : "text-sm text-red-600"
          }
        >
          {feedback.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
