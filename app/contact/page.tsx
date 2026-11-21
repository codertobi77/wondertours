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
import { SITE_CONFIG } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const { locale } = useLanguage();
  const isFr = locale === "fr";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    requestType: "",
    travelDate: "",
    travelers: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Rate limiting : max 3 soumissions par session (sessionStorage)
  const RATE_LIMIT_KEY = "contact_form_submissions";
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

  // Validation côté client
  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = isFr ? "Le nom est requis" : "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = isFr ? "L'email est requis" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = isFr ? "Format d'email invalide" : "Invalid email format";
    }

    if (!formData.phone.trim()) {
      errors.phone = isFr ? "Le téléphone est requis" : "Phone is required";
    } else if (!/^[\d\s\-\+\(\)]{8,}$/.test(formData.phone)) {
      errors.phone = isFr ? "Format de téléphone invalide" : "Invalid phone format";
    }

    if (!formData.subject.trim()) {
      errors.subject = isFr ? "L'objet est requis" : "Subject is required";
    }

    if (!formData.requestType) {
      errors.requestType = isFr ? "Le type de demande est requis" : "Request type is required";
    }

    if (!formData.message.trim()) {
      errors.message = isFr ? "Le message est requis" : "Message is required";
    } else if (formData.message.trim().length < 10) {
      errors.message = isFr ? "Le message doit contenir au moins 10 caractères" : "Message must be at least 10 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Récupérer le token CSRF au montage
  useEffect(() => {
    fetch("/api/csrf-token")
      .then((res) => res.json())
      .then((data) => data.token && setCsrfToken(data.token))
      .catch(() => {});
  }, []);

  // URL de la carte : constante statique (SITE_CONFIG, lib/constants.ts).
  // L'ancienne route /api/settings (lecture FS non persistante) a été
  // supprimée — la gestion dynamique passe par /api/dashboard/settings
  // (table `settings`).
  const mapEmbedUrl = SITE_CONFIG.map.embedUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation côté client
    if (!validateForm()) {
      return;
    }

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
          subject: formData.subject,
          requestType: formData.requestType,
          travelDate: formData.travelDate,
          travelers: formData.travelers ? Number(formData.travelers) : undefined,
          message: formData.message,
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
                  ? "Notre équipe vous contactera prochainement pour répondre à votre demande."
                  : "Our team will contact you shortly to answer your request."}
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
          subtitle="CONTACT"
          titleFr="Parlons de votre prochain voyage"
          titleEn="Let's talk about your next trip"
          descriptionFr="Contactez-nous pour planifier votre voyage au Bénin, au Togo ou au Ghana, demander un devis ou simplement en savoir plus sur nos services."
          descriptionEn="Contact us to plan your trip to Benin, Togo or Ghana, request a quote or simply learn more about our services."
          ctaFr="Remplir le formulaire"
          ctaEn="Fill in the form"
          ctaHref="#form"
          secondaryCtaFr="WhatsApp"
          secondaryCtaEn="WhatsApp"
          secondaryCtaHref={SITE_CONFIG.links.whatsapp}
          image="/photos_site wonder_tours/IMG-20250116-WA0020.jpg"
        />

        {/* Contact Info */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text mb-2">{isFr ? "Adresse" : "Address"}</h3>
                <p className="text-text-secondary">{SITE_CONFIG.contact.address}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text mb-2">{isFr ? "Téléphone" : "Phone"}</h3>
                <a
                  href={`tel:${SITE_CONFIG.contact.phone}`}
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  {SITE_CONFIG.contact.phone}
                </a>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text mb-2">Email</h3>
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  {SITE_CONFIG.contact.email}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Form and Map */}
        <section id="form" className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form */}
              <div>
                <SectionHeading
                  title={isFr ? "Envoyez-nous un message" : "Send us a message"}
                  align="left"
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
                    error={fieldErrors.name}
                    required
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={fieldErrors.email}
                    required
                  />
                  
                  <Input
                    label={isFr ? "Téléphone / WhatsApp" : "Phone / WhatsApp"}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={fieldErrors.phone}
                    required
                  />
                  
                  <Input
                    label={isFr ? "Objet" : "Subject"}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    error={fieldErrors.subject}
                    required
                  />
                  
                  <Select
                    label={isFr ? "Type de demande" : "Request type"}
                    options={[
                      { value: "", label: isFr ? "Sélectionnez un type" : "Select a type" },
                      { value: "circuit", label: isFr ? "Réservation de circuit" : "Tour booking" },
                      { value: "sejour", label: isFr ? "Organisation de séjour" : "Stay planning" },
                      { value: "hotel", label: isFr ? "Réservation d'hôtel" : "Hotel booking" },
                      { value: "info", label: isFr ? "Demande d'informations" : "Information request" },
                      { value: "autre", label: isFr ? "Autre" : "Other" }
                    ]}
                    value={formData.requestType}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                    error={fieldErrors.requestType}
                    required
                  />
                  
                  <Input
                    label={isFr ? "Date prévue du voyage" : "Planned travel date"}
                    type="date"
                    value={formData.travelDate}
                    onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  />
                  
                  <Input
                    label={isFr ? "Nombre de voyageurs" : "Number of travelers"}
                    type="number"
                    min="1"
                    value={formData.travelers}
                    onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                  />
                  
                  <Textarea
                    label={isFr ? "Message" : "Message"}
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      isFr
                        ? "Décrivez votre projet de voyage, vos questions ou vos demandes spécifiques..."
                        : "Describe your travel project, your questions or your specific requests..."
                    }
                    error={fieldErrors.message}
                    required
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
                </form>
              </div>

              {/* Map and WhatsApp */}
              <div className="space-y-8">
                {/* Map */}
                <div>
                  <SectionHeading
                    title={isFr ? "Notre localisation" : "Our location"}
                    align="left"
                  />
                  <div className="rounded-2xl overflow-hidden h-64">
                    <iframe
                      src={mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={isFr ? "Carte Google Maps - Wonder Tours and Services" : "Google Maps - Wonder Tours and Services"}
                    />
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <div className="bg-green-50 p-8 rounded-2xl border border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-text mb-2">
                        {isFr ? "Discutez sur WhatsApp" : "Chat on WhatsApp"}
                      </h3>
                      <p className="text-text-secondary mb-4">
                        {isFr
                          ? "Contactez-nous directement sur WhatsApp pour une réponse rapide."
                          : "Contact us directly on WhatsApp for a quick response."}
                      </p>
                      <a
                        href={SITE_CONFIG.links.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {isFr ? "Ouvrir WhatsApp" : "Open WhatsApp"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
