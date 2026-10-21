"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";

/** Données de préremplissage en mode édition. */
export interface UserFormInitial {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive?: boolean;
}

/** Préremplissage depuis un utilisateur existant (ou formulaire vierge). */
function toFormState(initial?: UserFormInitial) {
  return {
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    password: "",
    passwordConfirm: "",
    role: initial?.role ?? "editor",
    isActive: initial?.isActive ?? true,
  };
}

type FormState = ReturnType<typeof toFormState>;

export function UserForm({ initial }: { initial?: UserFormInitial }) {
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
    if (!form.email.trim()) {
      setError("L'email est requis.");
      return;
    }
    // Création : mot de passe obligatoire ; édition : optionnel (inchangé si vide).
    if (!isEdit && form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (form.password && form.password !== form.passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        isEdit ? `/api/dashboard/users/${initial!.id}` : "/api/dashboard/users",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            // PATCH : omettre le mot de passe s'il n'est pas renouvelé.
            ...(form.password ? { password: form.password } : {}),
            firstName: form.firstName,
            lastName: form.lastName,
            role: form.role,
            isActive: form.isActive,
          }),
        }
      );
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      router.push("/dashboard/users");
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
          <Button variant="ghost" href="/dashboard/users">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Mettez à jour le compte utilisateur"
                : "Ajoutez un nouvel utilisateur au dashboard"}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          <Save className="w-4 h-4 mr-2" />
          {busy ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
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
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  placeholder="Eric"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
                <Input
                  label="Nom *"
                  placeholder="BOKOSSA"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </div>
              <Input
                label="Email *"
                type="email"
                placeholder="eric@wondertoursandservices.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={isEdit ? "Nouveau mot de passe (laisser vide pour conserver)" : "Mot de passe *"}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                value={form.passwordConfirm}
                onChange={(e) => update("passwordConfirm", e.target.value)}
              />
              <Select
                label="Rôle *"
                options={[
                  { value: "admin", label: "Administrateur" },
                  { value: "editor", label: "Éditeur" },
                  { value: "viewer", label: "Lecteur" },
                ]}
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statut du compte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <label htmlFor="user-active" className="text-sm font-medium text-gray-700">
                  Actif
                </label>
                <input
                  id="user-active"
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
