"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface PublicTestimonialFormProps {
  isOpen: boolean;
  onClose: () => void;
  circuitId?: string | null;
}

export function PublicTestimonialForm({
  isOpen,
  onClose,
  circuitId,
}: PublicTestimonialFormProps) {
  const { locale, t } = useLanguage();
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [form, setForm] = useState({
    name: "",
    country: "",
    rating: 5,
    text: "",
    textEn: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tf = t.dashboard.testimonials.publicForm;

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) {
      setError(tf.nameRequired);
      return;
    }
    if (form.text.trim().length < 10) {
      setError(tf.textRequired);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          country: form.country || null,
          rating: form.rating,
          text: form.text,
          textEn: form.textEn || null,
          circuitId: circuitId || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || tf.errorDefault);
        setStep("error");
        return;
      }
      setStep("success");
    } catch {
      setError(tf.errorNetwork);
      setStep("error");
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setForm({ name: "", country: "", rating: 5, text: "", textEn: "" });
    setStep("form");
    setError(null);
  }

  return (
    <Dialog isOpen={isOpen} onClose={() => { resetForm(); onClose(); }}>
      <div className="p-6 sm:p-8">
        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{tf.title}</h2>
              <p className="text-gray-600 mt-1">{tf.subtitle}</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label={tf.nameLabel}
                placeholder={tf.namePlaceholder}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                minLength={2}
              />

              <Input
                label={tf.countryLabel}
                placeholder={tf.countryPlaceholder}
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tf.ratingLabel}
                </label>
                <div className="flex items-center gap-2" role="radiogroup" aria-label={`${tf.ratingAriaLabel} ${locale === "fr" ? "sur" : "out of"} 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => update("rating", star)}
                      className="focus:outline-none"
                      aria-label={`${tf.ratingAriaLabel} ${star} ${locale === "fr" ? "sur" : "out of"} 5`}
                      role="radio"
                      aria-checked={star <= form.rating}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= form.rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({form.rating}/5)</span>
                </div>
              </div>

              <Textarea
                label={tf.textLabel}
                rows={5}
                placeholder={tf.textPlaceholder}
                value={form.text}
                onChange={(e) => update("text", e.target.value)}
                required
                minLength={10}
              />

              <Textarea
                label={tf.textEnLabel}
                rows={5}
                placeholder={tf.textEnPlaceholder}
                value={form.textEn}
                onChange={(e) => update("textEn", e.target.value)}
              />
            </div>

            <Button type="submit" disabled={busy} className="w-full" size="lg">
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {tf.submitting}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {tf.submit}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              {tf.consent}
            </p>
          </form>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tf.successTitle}</h3>
            <p className="text-gray-600 mb-6">{tf.successMessage}</p>
            <Button onClick={() => { resetForm(); onClose(); }} size="lg">
              {tf.close}
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tf.errorTitle}</h3>
            <p className="text-gray-600 mb-6">
              {error || tf.errorDefault}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep("form")} size="lg">
                {tf.retry}
              </Button>
              <Button onClick={() => { resetForm(); onClose(); }} size="lg">
                {tf.close}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}