"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { readApiError } from "@/components/dashboard/api-error";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  role: "editor",
  isActive: true,
};

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.email.trim()) {
      setError("L'email est requis.");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/dashboard/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive,
        }),
      });
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
            <h1 className="text-3xl font-bold text-gray-900">Nouvel utilisateur</h1>
            <p className="text-gray-600 mt-1">Ajoutez un nouvel utilisateur au dashboard</p>
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          <Save className="w-4 h-4 mr-2" />
          {busy ? "Création…" : "Créer"}
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
                label="Mot de passe *"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <Input
                label="Confirmer le mot de passe *"
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
