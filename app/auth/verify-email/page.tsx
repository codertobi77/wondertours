"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      // Mise à jour différée pour éviter un setState synchrone dans l'effet
      // (rendu en cascade, interdit par react-hooks/set-state-in-effect).
      setTimeout(() => {
        setStatus("error");
        setMessage(
          isFr
            ? "Jeton de vérification manquant. Veuillez vérifier le lien dans votre email."
            : "Verification token missing. Please check the link in your email."
        );
      }, 0);
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token ?? "")}`, {
          method: "POST",
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setStatus("success");
          setMessage(
            data.message ||
              (isFr
                ? "Votre email a été vérifié avec succès !"
                : "Your email has been successfully verified!")
          );
        } else {
          setStatus("error");
          setMessage(
            data.error ||
              (isFr
                ? "Le jeton de vérification est invalide ou a expiré."
                : "The verification token is invalid or has expired.")
          );
        }
      } catch {
        setStatus("error");
        setMessage(
          isFr
            ? "Une erreur est survenue. Veuillez réessayer plus tard."
            : "An error occurred. Please try again later."
        );
      }
    }

    verifyEmail();
  }, [isFr]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-6" />
            <h1 className="font-heading text-3xl font-bold text-text mb-4">
              {isFr ? "Vérification de l'email" : "Email Verification"}
            </h1>
            <p className="text-text-secondary text-lg">
              {isFr
                ? "Vérification de votre adresse email en cours..."
                : "Verifying your email address..."}
            </p>
          </div>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-md mx-auto">
            {status === "success" ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
                  {isFr ? "Email vérifié !" : "Email Verified!"}
                </h1>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
                  {isFr ? "Échec de la vérification" : "Verification Failed"}
                </h1>
              </>
            )}

            <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" href="/dashboard/login">
                <Mail className="w-4 h-4 mr-2" />
                {isFr ? "Se connecter" : "Sign in"}
              </Button>
              <Button variant="outline" size="lg" href="/">
                {isFr ? "Retour à l'accueil" : "Back to home"}
              </Button>
            </div>

            {status === "error" && (
              <div className="mt-12 p-6 bg-background rounded-xl">
                <h3 className="font-heading text-lg font-bold text-text mb-4">
                  {isFr ? "Besoin d'aide ?" : "Need help?"}
                </h3>
                <p className="text-text-secondary mb-4">
                  {isFr
                    ? "Si le lien a expiré, vous pouvez demander un nouvel email de vérification."
                    : "If the link has expired, you can request a new verification email."}
                </p>
                <Link
                  href="/dashboard/login"
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  {isFr ? "Se connecter pour renvoyer l'email" : "Sign in to resend email"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}