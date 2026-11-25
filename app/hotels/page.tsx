"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { LocalizedHero } from "@/components/common/localized-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";

export default function HotelsPage() {
  const { locale } = useLanguage();
  const isFr = locale === "fr";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    arrivalDate: "",
    departureDate: "",
    travelers: "",
    accommodationType: "",
    budget: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Rate limiting : max 3 soumissions par session (sessionStorage)
  const RATE_LIMIT_KEY = "hotel_form_submissions";
  const RATE_LIMIT_MAX = 3;

  function checkRateLimit(): boolean {
    if (typeof window === "undefined") return true;
    const count = parseInt(sessionStorage.getItem(RATE_LIMIT_KEY) ?? "0", 10);
    return count < RATE_LIMIT_MAX;
  }

  function incrementRateLimit(): void {
    if (typeof window === "undefined") return;
    const count = parseInt(sessionStorage.getItem(RATE_LIMIT_KEY) ?? "0", 10);
    sessionStorage.setItem(RATE_LIMIT_KEY, String(count + 1));
  }

  // Récupérer le token CSRF au montage
  useEffect(() => {
    fetch("/api/csrf-token", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => data.token && setCsrfToken(data.token))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification rate limiting côté client
    if (!checkRateLimit()) {
      setErrorMessage(
        isFr
          ? "Trop de tentatives. Veuillez attendre avant de renvoyer le formulaire."
          : "Too many attempts. Please wait before resubmitting."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: isFr
            ? "Demande de réservation d'hébergement"
            : "Accommodation booking request",
          requestType: "hotel",
          travelDate: formData.arrivalDate,
          travelers: formData.travelers ? Number(formData.travelers) : undefined,
          message: [
            isFr
              ? `Type d'hébergement souhaité : ${formData.accommodationType}`
              : `Requested accommodation type: ${formData.accommodationType}`,
            isFr
              ? `Budget approximatif par nuit : ${formData.budget}`
              : `Approximate nightly budget: ${formData.budget}`,
            isFr
              ? `Date de départ : ${formData.departureDate || "non précisée"}`
              : `Departure date: ${formData.departureDate || "not specified"}`,
            "",
            formData.message,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const details = Array.isArray((data as { details?: unknown[] })?.details)
          ? ` (${(data as { details: { message?: string }[] }).details.map((d) => d.message).join(", ")})`
          : "";
        setErrorMessage(
          (data as { error?: string })?.error
            ? `${(data as { error: string }).error}${details}`
            : isFr
              ? "Une erreur est survenue lors de l'envoi. Veuillez réessayer."
              : "An error occurred while sending. Please try again."
        );
        return;
      }

      setIsSubmitted(true);
      incrementRateLimit();
    } catch {
      setErrorMessage(
        isFr
          ? "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez."
          : "Unable to reach the server. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-heading text-3xl font-bold text-text mb-4">
                {isFr ? "Votre demande a bien été envoyée" : "Your request has been sent"}
              </h2>
              <p className="text-text-secondary text-lg mb-8">
                {isFr
                  ? "Un conseiller Wonder Tours and Services vous contactera prochainement pour vous accompagner dans votre recherche d'hébergement."
                  : "A Wonder Tours and Services advisor will contact you shortly to assist with your accommodation search."}
              </p>
              <Button variant="primary" href="/" onClick={() => setIsSubmitted(false)}>
                {isFr ? "Retour à l'accueil" : "Back to home"}
              </Button>
            </div>
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
      
      <main className="flex-1">
        {/* Hero */}
        <LocalizedHero
          subtitle="RÉSERVATION D'HÔTELS"
          titleFr="Trouvez votre hébergement au Bénin, au Togo ou au Ghana"
          titleEn="Find your accommodation in Benin, Togo or Ghana"
          descriptionFr="Nous vous aidons à trouver et réserver l'hébergement parfait pour votre séjour au Bénin, au Togo ou au Ghana, selon vos préférences et votre budget."
          descriptionEn="We help you find and book the perfect accommodation for your stay in Benin, Togo or Ghana, according to your preferences and budget."
          ctaFr="Faire une demande"
          ctaEn="Make a request"
          ctaHref="#form"
          image="/photos_site wonder_tours/IMG_20260221_103124_311.jpg"
        />

        {/* Info Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <SectionHeading
                title={isFr ? "Notre service d'assistance hôtelière" : "Our hotel assistance service"}
              />
              <p className="text-text-secondary text-xl leading-relaxed mb-8">
                {isFr
                  ? "Un conseiller Wonder Tours and Services vous accompagnera dans votre recherche d'hébergement pour trouver l'hôtel idéal adapté à vos besoins, votre budget et vos préférences."
                  : "A Wonder Tours and Services advisor will assist you in your accommodation search to find the ideal hotel suited to your needs, budget and preferences."}
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {(isFr
                  ? [
                      "Sélection d'hôtels de qualité",
                      "Meilleurs tarifs négociés",
                      "Assistance personnalisée",
                    ]
                  : [
                      "Quality hotel selection",
                      "Best negotiated rates",
                      "Personalized assistance",
                    ]
                ).map((benefit, index) => (
                  <div key={index} className="bg-background p-6 rounded-xl">
                    <p className="text-text font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section id="form" className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <SectionHeading
                title={isFr ? "Faites une demande de réservation" : "Submit a booking request"}
              />
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errorMessage}
                  </div>
                )}
                <Input
                  label={isFr ? "Nom complet" : "Full name"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                
                <Input
                  label={isFr ? "Téléphone / WhatsApp" : "Phone / WhatsApp"}
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label={isFr ? "Date d'arrivée" : "Arrival date"}
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    required
                  />
                  
                  <Input
                    label={isFr ? "Date de départ" : "Departure date"}
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    required
                  />
                </div>
                
                <Input
                  label={isFr ? "Nombre de voyageurs" : "Number of travelers"}
                  type="number"
                  min="1"
                  value={formData.travelers}
                  onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                  required
                />
                
                <Select
                  label={isFr ? "Type d'hébergement" : "Accommodation type"}
                  options={[
                    { value: "", label: isFr ? "Sélectionnez un type" : "Select a type" },
                    { value: "hotel", label: isFr ? "Hôtel" : "Hotel" },
                    { value: "guesthouse", label: isFr ? "Guesthouse / Auberge" : "Guesthouse" },
                    { value: "resort", label: "Resort" },
                    { value: "villa", label: "Villa" },
                    { value: "autre", label: isFr ? "Autre" : "Other" }
                  ]}
                  value={formData.accommodationType}
                  onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
                  required
                />
                
                <Select
                  label={isFr ? "Budget approximatif (par nuit)" : "Approximate budget (per night)"}
                  options={[
                    { value: "", label: isFr ? "Sélectionnez une fourchette" : "Select a range" },
                    { value: "low", label: isFr ? "Moins de 50 000 FCFA" : "Under 50,000 FCFA" },
                    { value: "medium", label: "50 000 - 100 000 FCFA" },
                    { value: "high", label: "100 000 - 200 000 FCFA" },
                    { value: "luxury", label: isFr ? "Plus de 200 000 FCFA" : "Over 200,000 FCFA" }
                  ]}
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
                
                <Textarea
                  label={isFr ? "Message (préférences, besoins spécifiques...)" : "Message (preferences, specific needs...)"}
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    isFr
                      ? "Indiquez vos préférences, vos besoins spécifiques ou toute autre information utile..."
                      : "Tell us your preferences, specific needs or any other useful information..."
                  }
                />
                
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? isFr ? "Envoi en cours..." : "Sending..."
                    : isFr ? "Envoyer ma demande" : "Send my request"}
                </Button>
                
                <p className="text-text-secondary text-sm text-center">
                  {isFr
                    ? "Un conseiller Wonder Tours and Services vous contactera dans les 24h."
                    : "A Wonder Tours and Services advisor will contact you within 24 hours."}
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
