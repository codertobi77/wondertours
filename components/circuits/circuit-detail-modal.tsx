"use client";

import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Check, X } from "lucide-react";
import { Circuit } from "@/lib/data/circuits";
import { useLanguage } from "@/contexts/language-context";

interface CircuitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuit: Circuit;
}

export function CircuitDetailModal({ isOpen, onClose, circuit }: CircuitDetailModalProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";

  // Champs FR avec repli automatique sur la traduction EN (ou
  // inversement) quand la colonne En n'est pas renseignée en base.
  const title = isFr ? circuit.title : circuit.titleEn || circuit.title;
  const categories = isFr
    ? circuit.categories
    : circuit.categoriesEn || circuit.categories;
  const destination = isFr
    ? circuit.destination
    : circuit.destinationEn || circuit.destination;
  const duration = isFr
    ? circuit.duration
    : circuit.durationEn || circuit.duration;
  const description = isFr
    ? circuit.description
    : circuit.descriptionEn || circuit.description;
  // Champs JSON : versions EN si renseignées, repli FR sinon.
  const highlights =
    !isFr && circuit.highlightsEn?.length ? circuit.highlightsEn : circuit.highlights;
  const itinerary =
    !isFr && circuit.itineraryEn?.length ? circuit.itineraryEn : circuit.itinerary;
  const included =
    !isFr && circuit.includedEn?.length ? circuit.includedEn : circuit.included;
  const excluded =
    !isFr && circuit.excludedEn?.length ? circuit.excludedEn : circuit.excluded;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="relative h-64 md:h-80">
        <img
          src={circuit.image}
          alt={title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((category) => (
              <Badge key={category} variant="default">{category}</Badge>
            ))}
            <Badge variant="secondary">{destination}</Badge>
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            {title}
          </h2>
          <div className="flex flex-wrap gap-4 text-white text-sm">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {duration}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {destination}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6 pb-6 border-b">
          <div>
            <span className="text-3xl font-bold text-primary">
              {circuit.price.toLocaleString()} FCFA
            </span>
            <span className="text-text-secondary text-sm"> {isFr ? "/personne" : "/person"}</span>
          </div>
          <Button variant="primary" href="/contact">
            {isFr ? "Demander un devis" : "Request a quote"}
          </Button>
        </div>

        <div className="mb-6">
          <h3 className="font-heading text-xl font-bold text-text mb-3">
            {isFr ? "À propos de ce circuit" : "About this tour"}
          </h3>
          <p className="text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-heading text-xl font-bold text-text mb-3">
            {isFr ? "Points forts" : "Highlights"}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-text-secondary text-sm">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-heading text-xl font-bold text-text mb-3">
            {isFr ? "Programme" : "Itinerary"}
          </h3>
          <div className="space-y-4">
            {itinerary.map((day) => (
              <div key={day.day} className="bg-background p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="accent">{isFr ? `Jour ${day.day}` : `Day ${day.day}`}</Badge>
                  <h4 className="font-heading font-bold text-text">
                    {day.title}
                  </h4>
                </div>
                <p className="text-text-secondary text-sm">{day.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-text mb-3">
              {isFr ? "Ce qui est inclus" : "What's included"}
            </h3>
            <ul className="space-y-2">
              {included.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-text-secondary text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-text mb-3">
              {isFr ? "Ce qui n'est pas inclus" : "What's not included"}
            </h3>
            <ul className="space-y-2">
              {excluded.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <X className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-text-secondary text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
