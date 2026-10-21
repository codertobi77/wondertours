"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardImage, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin } from "lucide-react";
import { Circuit } from "@/lib/data/circuits";
import { useLanguage } from "@/contexts/language-context";
import { CircuitDetailModal } from "./circuit-detail-modal";

interface CircuitCardProps {
  circuit: Circuit;
}

export function CircuitCard({ circuit }: CircuitCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -8 }}
      >
        <Card className="group h-full">
          <CardImage src={circuit.image} alt={title} />
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="default">{category}</Badge>
                ))}
              </div>
              <div className="flex items-center text-text-secondary text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {duration}
              </div>
            </div>

            <h3 className="font-heading text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors">
              {title}
            </h3>

            <div className="flex items-center text-text-secondary text-sm mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              {destination}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold text-primary">
                {circuit.price.toLocaleString()} FCFA
              </div>
              <span className="text-text-secondary text-sm">
                {isFr ? "/personne" : "/person"}
              </span>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsModalOpen(true)}
            >
              {isFr ? "Découvrir" : "Discover"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <CircuitDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        circuit={circuit}
      />
    </>
  );
}
