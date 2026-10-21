"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Check, X } from "lucide-react";
import { Circuit } from "@/lib/data/circuits";
import { useLanguage } from "@/contexts/language-context";

interface CircuitDetailContentProps {
  circuit: Circuit;
}

export function CircuitDetailContent({ circuit }: CircuitDetailContentProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";

  const faqs = isFr
    ? [
        {
          q: "Comment réserver ce circuit ?",
          a: "Contactez-nous via le formulaire de contact ou WhatsApp pour réserver ce circuit. Notre équipe vous accompagnera dans toutes les étapes.",
        },
        {
          q: "Quelle est la meilleure période pour ce circuit ?",
          a: "La meilleure période dépend de la destination. Contactez-nous pour connaître les recommandations spécifiques à ce circuit.",
        },
        {
          q: "Le circuit est-il adapté aux enfants ?",
          a: "Certains circuits sont adaptés aux familles. Contactez-nous pour discuter de vos besoins spécifiques.",
        },
        {
          q: "Quels modes de paiement sont acceptés ?",
          a: "Nous acceptons plusieurs modes de paiement. Contactez-nous pour connaître les options disponibles.",
        },
      ]
    : [
        {
          q: "How do I book this tour?",
          a: "Contact us via the contact form or WhatsApp to book this tour. Our team will guide you through every step.",
        },
        {
          q: "When is the best time for this tour?",
          a: "The best time depends on the destination. Contact us for recommendations specific to this tour.",
        },
        {
          q: "Is this tour suitable for children?",
          a: "Some tours are family-friendly. Contact us to discuss your specific needs.",
        },
        {
          q: "Which payment methods are accepted?",
          a: "We accept several payment methods. Contact us to find out about the available options.",
        },
      ];

  return (
    <main className="flex-1">
      {/* Hero Gallery */}
      <section className="relative h-[60vh] min-h-[400px]">
        <img
          src={circuit.image}
          alt={circuit.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 lg:px-8 pb-12">
          <div className="flex flex-wrap gap-3 mb-4">
            {circuit.categories.map((category) => (
              <Badge key={category} variant="default">{category}</Badge>
            ))}
            <Badge variant="secondary">{circuit.destination}</Badge>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {circuit.title}
          </h1>
          <div className="flex flex-wrap gap-6 text-white">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {circuit.duration}
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              {circuit.destination}
            </div>
          </div>
        </div>
      </section>

      {/* Price and CTA Bar */}
      <section className="bg-primary py-6 sticky top-20 z-40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <span className="text-3xl font-bold">{circuit.price.toLocaleString()} FCFA</span>
              <span className="text-gray-200"> {isFr ? "/personne" : "/person"}</span>
            </div>
            <Button variant="secondary" size="lg" href="/contact">
              {isFr ? "Demander un devis" : "Request a quote"}
            </Button>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl">
            <SectionHeading
              title={isFr ? "À propos de ce circuit" : "About this tour"}
              align="left"
            />
            <p className="text-text-secondary text-lg leading-relaxed">
              {circuit.description}
            </p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      {circuit.highlights.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              title={isFr ? "Points forts" : "Highlights"}
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {circuit.highlights.map((highlight, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-text font-medium">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Itinerary */}
      {circuit.itinerary.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              title={isFr ? "Programme détaillé" : "Detailed itinerary"}
            />
            <div className="max-w-4xl mx-auto space-y-8">
              {circuit.itinerary.map((day) => (
                <div key={day.day} className="relative pl-8 pb-8 border-l-2 border-primary/30 last:pb-0">
                  <div className="absolute left-0 top-0 w-4 h-4 bg-primary rounded-full -translate-x-[9px]"></div>
                  <div className="bg-background p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="accent">{isFr ? `Jour ${day.day}` : `Day ${day.day}`}</Badge>
                      <h3 className="font-heading text-xl font-bold text-text">
                        {day.title}
                      </h3>
                    </div>
                    <p className="text-text-secondary">{day.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Included / Excluded */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <SectionHeading
                title={isFr ? "Ce qui est inclus" : "What's included"}
                align="left"
              />
              <ul className="space-y-3">
                {circuit.included.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading
                title={isFr ? "Ce qui n'est pas inclus" : "What's not included"}
                align="left"
              />
              <ul className="space-y-3">
                {circuit.excluded.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <SectionHeading
            title={isFr ? "Galerie photos" : "Photo gallery"}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src="[PHOTO GALERIE À REMPLACER]"
                  alt={`${circuit.title} gallery photo ${i}`}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <SectionHeading
            title={isFr ? "Questions fréquentes" : "Frequently asked questions"}
          />
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-heading text-lg font-bold text-text mb-2">
                  {faq.q}
                </h3>
                <p className="text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary relative">
        <div className="absolute inset-0">
          <img
            src="[PHOTO CTA CIRCUIT À REMPLACER]"
            alt={isFr ? "Réserver" : "Book"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/90" />
        </div>
        <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center text-white">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            {isFr ? "Ce circuit vous intéresse ?" : "Interested in this tour?"}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
            {isFr
              ? "Contactez-nous pour réserver ce circuit ou pour plus d'informations."
              : "Contact us to book this tour or for more information."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" href="/contact">
              {isFr ? "Demander une réservation" : "Request a booking"}
            </Button>
            <Button variant="outline" size="lg" href="/circuits" className="border-white text-white hover:bg-white hover:text-primary">
              {isFr ? "Voir d'autres circuits" : "See other tours"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
