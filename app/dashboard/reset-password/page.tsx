"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (response.ok) {
        setSuccess(true);
        return;
      }
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Réinitialisation impossible. Réessayez.");
    } catch {
      setError("Erreur réseau — vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Nouveau mot de passe
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Définissez le nouveau mot de passe de votre compte.
          </p>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-600">
                Lien de réinitialisation incomplet.
              </p>
              <Button href="/dashboard/forgot-password" className="w-full">
                Demander un nouveau lien
              </Button>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
              <p className="text-sm text-gray-700">
                Votre mot de passe a été modifié avec succès. Vous pouvez
                désormais vous connecter.
              </p>
              <Button href="/dashboard/login" className="w-full">
                Aller à la connexion
              </Button>
            </div>
          ) : (
            <>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="8 caractères minimum"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="8 caractères minimum"
                      className="pl-10"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enregistrement…" : "Modifier le mot de passe"}
                </Button>
                {error && (
                  <p role="alert" className="text-sm text-red-600 text-center">
                    {error}
                  </p>
                )}
              </form>

              <div className="mt-6 text-center pt-6 border-t border-gray-200">
                <Link
                  href="/dashboard/login"
                  className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams impose une boundary Suspense (pré-rendu Next).
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
