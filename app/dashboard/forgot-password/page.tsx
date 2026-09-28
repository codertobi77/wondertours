"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSent(true);
        return;
      }
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Envoi impossible. Réessayez.");
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
            Mot de passe oublié
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Indiquez votre email : nous vous enverrons un lien de
            réinitialisation.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <MailCheck className="w-12 h-12 mx-auto text-green-600" />
              <p className="text-sm text-gray-700">
                Si un compte actif existe avec cet email, un lien de
                réinitialisation vient d’être envoyé. Vérifiez votre boîte
                de réception (et vos spams).
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.replace("/dashboard/login")}
              >
                Retour à la connexion
              </Button>
            </div>
          ) : (
            <>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="admin@wondertours.bj"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi…" : "Envoyer le lien"}
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
