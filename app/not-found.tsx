"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { useLanguage } from "@/contexts/language-context";

export default function NotFound() {
  const { locale } = useLanguage();
  const isFr = locale === "fr";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <span className="text-9xl font-bold text-amber-500/30">404</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {isFr ? "Page introuvable" : "Page not found"}
            </h1>

            <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              {isFr
                ? "Désolé, la page que vous cherchez n'existe pas ou a été déplacée."
                : "Sorry, the page you're looking for doesn't exist or has been moved."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" href="/">
                <Home className="w-4 h-4 mr-2" />
                {isFr ? "Retour à l'accueil" : "Back to home"}
              </Button>
              <Button variant="outline" size="lg" href="/circuits">
                <Search className="w-4 h-4 mr-2" />
                {isFr ? "Explorer nos circuits" : "Explore our tours"}
              </Button>
            </div>

            <div className="mt-12 p-6 bg-background rounded-xl">
              <h3 className="font-heading text-lg font-bold text-text mb-4">
                {isFr ? "Besoin d'aide ?" : "Need help?"}
              </h3>
              <p className="text-text-secondary mb-4">
                {isFr
                  ? "Contactez-nous directement pour trouver ce que vous cherchez."
                  : "Contact us directly to find what you're looking for."}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {isFr ? "Nous contacter" : "Contact us"}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}