"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { LocalizedHero } from "@/components/common/localized-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";

/**
 * Corps bilingue de la page "À propos". Le rendu serveur ne peut pas lire
 * la locale (contexte client) : la page serveur garde les métadonnées et
 * délègue l'affichage à ce composant client.
 */
interface AboutContentProps {
  /** Biographie du fondateur (clé settings `founder_bio_fr`) ; vide → texte statique. */
  founderBioFr?: string | null;
  /** Biographie du fondateur (clé settings `founder_bio_en`) ; vide → texte statique. */
  founderBioEn?: string | null;
}

export function AboutContent({ founderBioFr, founderBioEn }: AboutContentProps) {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";
  const [bioFr, setBioFr] = useState<string | null>(founderBioFr ?? null);
  const [bioEn, setBioEn] = useState<string | null>(founderBioEn ?? null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((page: { items?: { key: string; value: string | null }[] } | null) => {
        if (cancelled || !page?.items) return;
        for (const s of page.items) {
          if (s.key === "founder_bio_fr") setBioFr(s.value?.trim() || null);
          if (s.key === "founder_bio_en") setBioEn(s.value?.trim() || null);
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);
  const founderBio = ((isFr ? bioFr : bioEn) ?? "").trim();

  const values = isFr
    ? [
        { title: "Authenticité", description: "Des expériences vraies et immersives au cœur des cultures de l'Afrique de l'Ouest." },
        { title: "Excellence", description: "Un service de qualité irréprochable pour chaque voyageur." },
        { title: "Respect", description: "Respect des cultures, des traditions et de l'environnement." },
        { title: "Hospitalité", description: "Un accueil chaleureux et personnalisé à chaque étape." },
        { title: "Culture", description: "Valorisation et transmission du patrimoine culturel de l'Afrique de l'Ouest." },
        { title: "Professionnalisme", description: "Une équipe expérimentée et dédiée à votre satisfaction." },
      ]
    : [
        { title: "Authenticity", description: "Real, immersive experiences at the heart of West African cultures." },
        { title: "Excellence", description: "Impeccable quality of service for every traveler." },
        { title: "Respect", description: "Respect for cultures, traditions and the environment." },
        { title: "Hospitality", description: "A warm, personalized welcome at every step." },
        { title: "Culture", description: "Promoting and passing on West African cultural heritage." },
        { title: "Professionalism", description: "An experienced team dedicated to your satisfaction." },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <LocalizedHero
          subtitle="NOTRE HISTOIRE"
          titleFr="Une passion pour le voyage. Une expertise du Bénin, du Togo et du Ghana."
          titleEn="A passion for travel. Expertise in Benin, Togo and Ghana."
          descriptionFr="Depuis plus de 20 ans, Wonder Tours and Services accompagne les voyageurs dans la découverte des trésors du Bénin, du Togo et du Ghana."
          descriptionEn="For over 20 years, Wonder Tours and Services has accompanied travelers in discovering Benin's, Togo's and Ghana's treasures."
          ctaFr="Voir tous les circuits"
          ctaEn="View all circuits"
          ctaHref="/circuits"
          secondaryCtaFr="Contact"
          secondaryCtaEn="Contact"
          secondaryCtaHref="/contact"
          image="/photos_site wonder_tours/IMG_20240113_142443_0.jpg"
        />

        {/* History Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
              <SectionHeading
              title={isFr ? "Notre histoire" : "Our history"}
              align="left"
              className="md:mb-[-25px] mb-4"
            />
            <div className="grid md:grid-cols-2 gap-12 md:items-center items-start">
              <div className="md:order-1 order-2">
                <p className="text-text-secondary leading-relaxed mb-6">
                  {isFr ? "Wonder Tours and Services est né d'une passion profonde pour l'Afrique de l'Ouest et de la volonté de partager la richesse culturelle et naturelle du Bénin, du Togo et du Ghana avec le monde entier." : "Wonder Tours and Services was born from a deep passion for West Africa and the desire to share the cultural and natural richness of Benin, Togo and Ghana with the world."}
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {isFr ? "Fondée par Eric Sylvestre BOKOSSA, notre entreprise s'est construite sur plus de deux décennies d'expérience dans l'organisation d'excursions, de circuits et de séjours touristiques au Bénin, au Togo, au Ghana et à l'international." : "Founded by Eric Sylvestre BOKOSSA, our company has been built on over two decades of experience in organizing excursions, tours and tourist stays in Benin, Togo, Ghana and internationally."}
                </p>
                <p className="text-text-secondary leading-relaxed">
                  {isFr ? "Notre mission : offrir des expériences authentiques, respectueuses des cultures locales et inoubliables à chaque voyageur qui nous fait confiance." : "Our mission: to offer authentic experiences, respectful of local cultures and unforgettable to every traveler who trusts us."}
                </p>
              </div>
              <div className="relative max-w-md mx-auto md:order-2 order-1">
                <img
                  src="/photos_site wonder_tours/ameliorer.png"
                  alt={isFr ? "Notre histoire" : "Our history"}
                  className="rounded-2xl shadow-2xl w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Experience Highlight */}
        <section className="py-20 bg-primary relative">
          <div className="absolute inset-0">
            <img
              src="/photos_site wonder_tours/IMG_20260511_125355_183.jpg"
              alt={isFr ? "Notre expérience" : "Our experience"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center text-white py-12 md:py-20">
            <div className="text-5xl md:text-7xl font-heading font-bold mb-4">20+</div>
            <h2 className="font-heading text-2xl md:text-3xl md:text-4xl font-bold mb-4">
              {isFr ? "années d'expérience" : "years of experience"}
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-200">
              {isFr ? "Deux décennies d'expertise pour vous faire découvrir le meilleur du Bénin, du Togo et du Ghana" : "Two decades of expertise to help you discover the best of Benin, Togo and Ghana"}
            </p>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              title={isFr ? "Notre fondateur" : "Our founder"}
            />
            <div className="grid md:grid-cols-2 gap-12 md:items-center items-start">
              <div className="relative md:order-1 order-1">
                <img
                  src="/photos_site wonder_tours/eric.png"
                  alt={SITE_CONFIG.founder.name}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="md:order-2 order-2">
                <h3 className="font-heading text-3xl font-bold text-text mb-2">
                  {SITE_CONFIG.founder.name}
                </h3>
                <p className="text-accent font-medium mb-6">{isFr ? SITE_CONFIG.founder.title : "Founder"}</p>
                {founderBio ? (
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {founderBio}
                  </p>
                ) : (
                  <>
                    <p className="text-text-secondary leading-relaxed mb-6">
                      [BIOGRAPHIE DU FONDATEUR À FOURNIR PAR LE CLIENT]
                    </p>
                    <p className="text-text-secondary leading-relaxed">
                      {isFr
                        ? "Passionné par sa région et sa culture, Eric Sylvestre BOKOSSA a consacré sa vie à faire connaître les trésors du Bénin, du Togo et du Ghana aux voyageurs du monde entier. Sa vision : un tourisme respectueux, authentique et mémorable."
                        : "Passionate about his region and its culture, Eric Sylvestre BOKOSSA has devoted his life to introducing Benin's, Togo's and Ghana's treasures to travelers from around the world. His vision: respectful, authentic and memorable tourism."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              title={isFr ? "Nos valeurs" : "Our values"}
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">{index + 1}</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <SectionHeading
                subtitle={isFr ? "NOTRE VISION" : "OUR VISION"}
                title={isFr ? "Développer le tourisme en Afrique de l'Ouest" : "Developing West African tourism"}
              />
              <p className="text-text-secondary text-xl leading-relaxed mb-8">
                {isFr
                  ? "Notre ambition est de contribuer au développement du tourisme au Bénin, au Togo et au Ghana en faisant découvrir la richesse de notre patrimoine, de notre culture et de nos paysages aux voyageurs du monde entier. Nous croyons en un tourisme durable, respectueux et bénéfique pour les communautés locales."
                  : "Our ambition is to contribute to the development of tourism in Benin, Togo and Ghana by revealing the richness of our heritage, our culture and our landscapes to travelers from around the world. We believe in sustainable, respectful tourism that benefits local communities."}
              </p>
              <Button variant="primary" size="lg" href="/circuits">
                {isFr ? "Rejoignez-nous pour une aventure inoubliable" : "Join us for an unforgettable adventure"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
