"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Testimonial } from "@/lib/data/testimonials";
import { useLanguage } from "@/contexts/language-context";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  // Version anglaise si disponible (traduction DeepL à la publication),
  // repli sur le texte original sinon.
  const text = isFr ? testimonial.text : (testimonial.textEn ?? testimonial.text);
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {testimonial.avatar ? (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-text flex items-center justify-center text-white font-semibold text-lg border-2 border-amber-500 bg-black">
                  {getInitials(testimonial.name)}
                </div>
              )}
              <div>
                <p className="font-medium text-text">{testimonial.name}</p>
                <p className="text-sm text-text-secondary">{testimonial.country}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center mb-4">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
            ))}
          </div>

          <p className="text-text-secondary mb-6 leading-relaxed italic">
            "{text}"
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
