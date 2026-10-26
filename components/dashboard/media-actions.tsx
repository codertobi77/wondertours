"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Copy, Check, Trash2, Pencil, Save } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";

/** Bloc d'upload : image (≤ 5 Mo) + texte alternatif optionnel → POST /api/dashboard/media.
 * Les images raster sont d'abord compressées dans le navigateur (Phase 1b) :
 * 1920 px max, qualité ~0.82, ≤ 1.5 Mo — SVG et GIF passent tels quels. */
export function MediaUploader({ onChanged }: { onChanged?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [altTextEn, setAltTextEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Sélectionnez d'abord une image.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      let uploadFile: File = file;
      if (file.type !== "image/svg+xml" && file.type !== "image/gif") {
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1920,
            initialQuality: 0.82,
            useWebWorker: true,
          });
          if (compressed.size < file.size) {
            uploadFile = new File([compressed], file.name, {
              type: compressed.type || file.type,
            });
          }
        } catch {
          // Compression impossible (format non supporté…) : on envoie l'original.
        }
      }
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (altText.trim()) {
        formData.append("altText", altText.trim());
      }
      if (altTextEn.trim()) {
        formData.append("altTextEn", altTextEn.trim());
      }
      const response = await fetch("/api/dashboard/media", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      setAltText("");
      setAltTextEn("");
      setSuccess(true);
      onChanged?.();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un fichier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
          <div className="flex-1">
            <Input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              label="Image (JPEG, PNG, WebP, GIF ou SVG — 5 Mo max)"
            />
          </div>
          <div className="flex-1">
            <Input
              label="Texte alternatif FR (optionnel)"
              placeholder="Ex. : Plage d'Ouidah au coucher du soleil"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Texte alternatif EN (optionnel)"
              placeholder="e.g. Ouidah beach at sunset"
              value={altTextEn}
              onChange={(e) => setAltTextEn(e.target.value)}
            />
          </div>
          <Button type="button" onClick={handleUpload} disabled={busy}>
            <Upload className="w-4 h-4 mr-2" />
            {busy ? "Envoi…" : "Uploader"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && !error && (
          <p className="mt-3 text-sm text-green-600">
            Fichier ajouté à la médiathèque.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Édition inline des textes alternatifs FR/EN d'un média
 * (PATCH /api/dashboard/media/[id] — altText, altTextEn).
 */
export function MediaAltTextEditor({
  id,
  altText,
  altTextEn,
  onChanged,
}: {
  id: string;
  altText: string | null;
  altTextEn: string | null;
  onChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [fr, setFr] = useState(altText ?? "");
  const [en, setEn] = useState(altTextEn ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setFr(altText ?? "");
    setEn(altTextEn ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altText: fr.trim() || null,
          altTextEn: en.trim() || null,
        }),
      });
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      setEditing(false);
      onChanged?.();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-1 space-y-0.5">
        <p className="text-xs text-gray-500 truncate" title={altText ?? ""}>
          FR : {altText ?? "—"}
        </p>
        <p className="text-xs text-gray-500 truncate" title={altTextEn ?? ""}>
          EN : {altTextEn ?? "—"}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
          >
            <Pencil className="w-3 h-3" />
            Modifier les textes alternatifs
          </button>
          {error && (
            <span className="text-xs text-red-600" title={error}>
              ⚠
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <Input
        label="Alt (FR)"
        value={fr}
        onChange={(e) => setFr(e.target.value)}
        placeholder="Ex. : Plage d'Ouidah"
      />
      <Input
        label="Alt (EN)"
        value={en}
        onChange={(e) => setEn(e.target.value)}
        placeholder="e.g. Ouidah beach"
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={save} disabled={busy}>
          <Save className="w-4 h-4" />
          {busy ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(false)}
          disabled={busy}
        >
          Annuler
        </Button>
        {error && (
          <span className="text-xs text-red-600" title={error}>
            ⚠
          </span>
        )}
      </div>
    </div>
  );
}

/** Actions d'une carte média : copier l'URL, supprimer (DELETE /api/dashboard/media/[id]). */
export function MediaCardActions({
  id,
  url,
  onChanged,
}: {
  id: string;
  url: string;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie impossible");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer ce fichier de la médiathèque ?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/media/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      onChanged?.();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      {error && (
        <span className="text-xs text-red-600" title={error}>
          ⚠
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={copyUrl}
        disabled={busy}
        title={`Copier l'URL (${url})`}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1 text-red-600 hover:text-red-700"
        onClick={handleDelete}
        disabled={busy}
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
