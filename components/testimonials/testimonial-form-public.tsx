"use client";

import { useEffect, useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

/** Événement diffusé après une publication réussie (rafraîchit la liste). */
export const TESTIMONIAL_CREATED_EVENT = "wt:testimonial-created";

interface CircuitOption {
  id: string;
  title: string;
}

/**
 * Formulaire public « Laisser un témoignage » (page /temoignages).
 *
 * Publication immédiate : POST /api/testimonials (API PHP) → l'avis est
 * enregistré actif (isVerified=false) et visible dès l'envoi ; l'équipe
 * est notifiée par email et garde la modération dans le dashboard.
 * Anti-spam : honeypot `website` (champ caché, ignoré par les humains).
 */
export function TestimonialFormPublic() {
  const { locale } = useLanguage();
  const isFr = locale === "fr";

  const [circuits, setCircuits] = useState<CircuitOption[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    rating: 5,
    circuitId: "",
    travelDate: "",
    text: "",
    website: "", // honeypot : ne jamais pré-remplir ni afficher
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Liste des circuits pour « Circuit concerné » — best effort au montage.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/circuits?pageSize=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((page) => {
        if (
          !cancelled &&
          page &&
          Array.isArray(page.items) &&
          page.items.length > 0
        ) {
          setCircuits(
            page.items.map((c: { id: string; title: string }) => ({
              id: c.id,
              title: c.title,
            }))
          );
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          country: formData.country,
          rating: formData.rating,
          circuitId: formData.circuitId || undefined,
          date: formData.travelDate,
          text: formData.text,
          lang: isFr ? "fr" : "en", // pilote la traduction auto (DeepL)
          website: formData.website, // honeypot
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
      window.dispatchEvent(new Event(TESTIMONIAL_CREATED_EVENT));
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
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-text mb-3">
          {isFr ? "Merci pour votre témoignage !" : "Thank you for your testimonial!"}
        </h3>
        <p className="text-text-secondary mb-4">
          {isFr
            ? "Votre avis vient d'être publié sur cette page. L'équipe Wonder Tours and Services vous remercie de partager votre expérience."
            : "Your review has just been published on this page. The Wonder Tours and Services team thanks you for sharing your experience."}
        </p>
        <p className="text-sm text-text-secondary/80 italic">
          {isFr
            ? "Cette section se fermera automatiquement et la page remontera à la liste des témoignages."
            : "This section will close automatically and the page will return to the testimonials list."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-2xl shadow-lg space-y-6"
    >
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
        minLength={2}
        maxLength={100}
      />

      <Input
        label={isFr ? "Pays (optionnel)" : "Country (optional)"}
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        maxLength={100}
      />

      {/* Note : 5 étoiles cliquables */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          {isFr ? "Votre note" : "Your rating"}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormData({ ...formData, rating: value })}
              aria-label={`${value} / 5`}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  "w-7 h-7 transition-colors",
                  value <= formData.rating
                    ? "fill-secondary text-secondary"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-text-secondary">
            ({formData.rating}/5)
          </span>
        </div>
      </div>

      <Select
        label={isFr ? "Circuit concerné (optionnel)" : "Tour concerned (optional)"}
        options={[
          { value: "", label: isFr ? "Sélectionner" : "Select" },
          ...circuits.map((c) => ({ value: c.id, label: c.title })),
        ]}
        value={formData.circuitId}
        onChange={(e) => setFormData({ ...formData, circuitId: e.target.value })}
      />

      <Input
        label={isFr ? "Date du voyage (optionnelle)" : "Travel date (optional)"}
        type="date"
        value={formData.travelDate}
        onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
      />

      <Textarea
        label={isFr ? "Votre témoignage" : "Your testimonial"}
        rows={5}
        value={formData.text}
        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
        placeholder={
          isFr
            ? "Racontez votre expérience : ce que vous avez aimé, l'organisation, les rencontres..."
            : "Tell us about your experience: what you enjoyed, the organization, the encounters..."
        }
        required
        minLength={10}
        maxLength={5000}
      />

      {/* Honeypot anti-spam : champ caché (visuellement et pour les
          lecteurs d'écran) — les robots le remplissent, pas les humains. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          height: 0,
          overflow: "hidden",
        }}
      >
        <label>
          {isFr ? "Site web" : "Website"}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? isFr ? "Envoi en cours..." : "Sending..."
          : isFr ? "Publier mon témoignage" : "Publish my testimonial"}
      </Button>

      <p className="text-xs text-text-secondary text-center">
        {isFr
          ? "Votre témoignage sera publié immédiatement. L'équipe se réserve le droit de retirer tout contenu inapproprié."
          : "Your testimonial will be published immediately. The team reserves the right to remove any inappropriate content."}
      </p>
    </form>
  );
}
