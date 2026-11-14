"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { sanitizeHtmlBrOnly } from "@/lib/sanitize";

interface HeroProps {
  title: string;
  subtitle?: string;
  description: string;
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  videoCta?: { text: string; href: string };
  /** Image de fond unique (utilisée si `images` n'est pas fourni) */
  image: string;
  /** Diaporama : plusieurs images de fond avec fondu enchaîné */
  images?: string[];
  overlay?: boolean;
}

/** Intervalle entre deux slides en millisecondes */
const SLIDE_INTERVAL_MS = 6000;

export function Hero({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  videoCta,
  image,
  images,
  overlay = true,
}: HeroProps) {
  const slides = useMemo(
    () => (images && images.length > 0 ? images : [image]),
    [images, image],
  );
  const isSlideshow = slides.length > 1;
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Précharge les slides suivantes pour éviter un flash au premier changement
  useEffect(() => {
    if (!isSlideshow) return;
    slides.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [slides, isSlideshow]);

  // Avance automatiquement toutes les SLIDE_INTERVAL_MS
  useEffect(() => {
    if (!isSlideshow) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides, isSlideshow]);

  const goToSlide = (target: number) => {
    if (target === index) return;
    setIndex(target);
  };

  // Fondu enchaîné : la nouvelle image apparaît par-dessus l'ancienne
  const fadeVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <section className="relative h-screen min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Slideshow */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            variants={fadeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: prefersReducedMotion ? 0.3 : 1.2,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <img
              src={slides[index]}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-xs sm:text-sm font-medium uppercase tracking-wider text-secondary"
            >
              {subtitle}
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 leading-tight"
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlBrOnly(title) }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm sm:text-base md:text-lg text-gray-200 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          >
            {primaryCta && (
              <Button variant="primary" size="lg" href={primaryCta.href} className="w-full sm:w-auto">
                {primaryCta.text}
              </Button>
            )}
            {secondaryCta && (
              <Button variant="outline" size="lg" href={secondaryCta.href} className="border-white text-white hover:bg-amber-600 hover:border-amber-600 w-full sm:w-auto">
                {secondaryCta.text}
              </Button>
            )}
          </motion.div>

          {videoCta && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 md:mt-8"
            >
              <a
                href={videoCta.href}
                className="inline-flex items-center space-x-2 text-white hover:text-secondary transition-colors"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white flex items-center justify-center hover:border-secondary transition-colors">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                </div>
                <span className="font-medium text-sm sm:text-base">{videoCta.text}</span>
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Slideshow Indicators */}
      {isSlideshow && (
        <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 z-20 flex items-center gap-2">
          {slides.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Image ${i + 1}`}
              aria-current={i === index}
              onClick={() => goToSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  );
}
