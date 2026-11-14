"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { Hero } from "@/components/hero/hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { CircuitCard } from "@/components/circuits/circuit-card";
import { ServicesCarousel } from "@/components/services/services-carousel";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { BlogCard } from "@/components/blog/blog-card";
import { Button } from "@/components/ui/button";
import { WHY_CHOOSE_US } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";
import { PublicTestimonialForm } from "@/components/testimonials/public-testimonial-form";
import type { Circuit } from "@/lib/data/circuits";
import type { BlogPost } from "@/lib/data/blog";
import type { Testimonial } from "@/lib/data/testimonials";

interface ServiceVM {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
}

interface DestinationVM {
  id: string;
  name: string;
}

interface HomeContentProps {
  circuits: Circuit[];
  testimonials: Testimonial[];
  posts: BlogPost[];
  services: ServiceVM[];
  destinations: DestinationVM[];
}

/**
 * Corps bilingue de la page d'accueil. Le rendu serveur ne peut pas lire
 * la locale (contexte client) : la page serveur garde les métadonnées et
 * le fetch des données, puis délègue l'affichage à ce composant client.
 */
export function HomeContent({
  circuits,
  testimonials,
  posts,
  services,
  destinations,
}: HomeContentProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const [isTestimonialFormOpen, setIsTestimonialFormOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          subtitle={
            isFr
              ? "EXPLOREZ LE BÉNIN, LE TOGO ET LE GHANA AUTREMENT"
              : "EXPLORE BENIN, TOGO AND GHANA DIFFERENTLY"
          }
          title={
            isFr
              ? "Découvrez le Bénin, le Togo et le Ghana à travers<br />des expériences authentiques."
              : "Discover Benin, Togo and Ghana through<br />authentic experiences."
          }
          description={
            isFr
              ? "Avec plus de 20 ans d'expertise, Wonder Tours and Services vous accompagne dans la découverte du patrimoine culturel et naturel du Bénin, du Togo et du Ghana."
              : "With over 20 years of expertise, Wonder Tours and Services accompanies you in discovering Benin's, Togo's and Ghana's cultural and natural heritage."
          }
          primaryCta={{
            text: isFr ? "Découvrir nos circuits" : "Discover our tours",
            href: "/circuits",
          }}
          secondaryCta={{
            text: isFr ? "Planifier mon voyage" : "Plan my trip",
            href: "/contact",
          }}
          images={[
            "/images/hero/hero-1.jpg",
            "/images/hero/hero-2.jpg",
            "/images/hero/hero-3.jpg",
            "/images/hero/hero-4.jpg",
          ]}
          image="/images/hero/hero-1.jpg"
        />

        {/* Experience Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-6xl font-heading font-bold text-primary mb-4">
                  20+
                </div>
                <h2 className="font-heading text-3xl font-bold text-text mb-4">
                  {isFr ? "années d'expérience" : "years of experience"}
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  {isFr
                    ? "Une expertise construite au fil de nombreuses années d'accompagnement de voyageurs du monde entier dans la découverte du Bénin, du Togo et du Ghana."
                    : "Expertise built over many years of guiding travelers from around the world in discovering Benin, Togo and Ghana."}
                </p>
              </div>
              <div className="relative max-w-md mx-auto">
                <img
                  src="/photos_site wonder_tours/FB_IMG_1766953938984.jpg"
                  alt={isFr ? "Notre équipe" : "Our team"}
                  className="rounded-2xl shadow-2xl w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Popular Circuits Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              subtitle={
                isFr ? "Nos expériences incontournables" : "Our must-try experiences"
              }
              title={
                isFr
                  ? "Découvrez les destinations qui font la richesse<br />du Bénin, du Togo et du Ghana"
                  : "Discover the destinations that make Benin,<br />Togo and Ghana so rich"
              }
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {circuits.map((circuit) => (
                <CircuitCard key={circuit.id} circuit={circuit} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" href="/circuits">
                {isFr ? "Voir tous les circuits" : "View all tours"}
              </Button>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              title={
                isFr
                  ? "Voyagez avec une équipe qui connaît<br />le Bénin, le Togo et le Ghana"
                  : "Travel with a team that knows<br />Benin, Togo and Ghana"
              }
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {WHY_CHOOSE_US.map((item, index) => (
                <div
                  key={item.id}
                  className="text-center p-6 border-2 border-amber-500 rounded-xl"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text mb-3">
                    {isFr ? item.title : item.titleEn}
                  </h3>
                  <p className="text-text-secondary">
                    {isFr ? item.description : item.descriptionEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Destination Benin Section */}
        <section className="py-20 relative">
          <div className="absolute inset-0">
            <img
              src="/photos_site%20wonder_tours/IMG-20260805-WA0065.jpg"
              alt={isFr ? "Le Bénin, le Togo et le Ghana" : "Benin, Togo and Ghana"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center text-white">
            <SectionHeading
              title={isFr ? "Le Bénin, le Togo et le Ghana vous attendent" : "Benin, Togo and Ghana await you"}
              className="text-white"
            />
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
              {isFr
                ? "D'Ouidah à Abomey, de Lomé à Kumasi, découvrez des pays riches en histoire, en culture et en paysages exceptionnels."
                : "From Ouidah to Abomey, from Lomé to Kumasi, discover countries rich in history, culture and exceptional landscapes."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {destinations.map((destination) => (
                <span
                  key={destination.id}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white"
                >
                  {destination.name}
                </span>
              ))}
            </div>
            <Button variant="primary" size="lg" href="/circuits">
              {isFr ? "Explorer nos destinations" : "Explore our destinations"}
            </Button>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              title={isFr ? "Nos services touristiques" : "Our tourism services"}
            />
            <ServicesCarousel services={services} />
          </div>
        </section>

        {/* Vodoun/Culture Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <SectionHeading
                  subtitle={
                    isFr ? "PATRIMOINE ET CULTURE" : "HERITAGE AND CULTURE"
                  }
                  title={
                    isFr
                      ? "À la rencontre du patrimoine et de la culture de l'Afrique de l'Ouest"
                      : "Discover West African heritage and culture"
                  }
                  align="left"
                />
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {isFr
                    ? "Le Bénin, le Togo et le Ghana sont riches en traditions spirituelles et culturelles. Découvrez temples, cérémonies et traditions avec respect et authenticité."
                    : "Benin, Togo and Ghana are rich in spiritual and cultural traditions. Discover temples, ceremonies and traditions with respect and authenticity."}
                </p>
                <Button variant="primary" href="/circuits?category=Vodoun">
                  {isFr
                    ? "Découvrir nos expériences culturelles"
                    : "Discover our cultural experiences"}
                </Button>
              </div>
              <div className="order-1 md:order-2">
                <img
                  src="/photos_site wonder_tours/IMG-20260625-WA0041.jpg"
                  alt={isFr ? "Culture Vodoun" : "Vodoun culture"}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              title={
                isFr
                  ? "Ils ont voyagé avec Wonder Tours and Services"
                  : "They traveled with Wonder Tours and Services"
              }
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {testimonials.slice(0, 4).map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
            <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" href="/temoignages">
                {isFr ? "Voir tous les témoignages" : "View all testimonials"}
              </Button>
              <Button variant="primary" size="lg" onClick={() => setIsTestimonialFormOpen(true)}>
                {isFr ? "Partager mon témoignage" : "Share my testimonial"}
              </Button>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeading
              subtitle={isFr ? "CARNET DE VOYAGE" : "TRAVEL JOURNAL"}
              title={
                isFr
                  ? "Conseils, culture et actualités"
                  : "Tips, culture and news"
              }
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" href="/blog">
                {isFr ? "Voir toutes les actualités" : "View all news"}
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-primary relative">
          <div className="absolute inset-0">
            <img
              src="/photos_site%20wonder_tours/IMG-20260625-WA0040.jpg"
              alt={isFr ? "Circuit Bénin, Togo et Ghana" : "Benin, Togo and Ghana tour"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center text-white">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
              {isFr ? "Prêt à découvrir le Bénin, le Togo et le Ghana ?" : "Ready to discover Benin, Togo and Ghana?"}
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
              {isFr
                ? "Laissez-nous imaginer avec vous une expérience adaptée à vos envies."
                : "Let us imagine an experience tailored to your desires."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" href="/contact">
                {isFr ? "Planifier mon voyage" : "Plan my trip"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/contact"
                className="border-white text-white hover:bg-amber-600 hover:border-amber-600"
              >
                {isFr ? "Nous contacter" : "Contact us"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />

      {/* Public Testimonial Form Modal */}
      <PublicTestimonialForm
        isOpen={isTestimonialFormOpen}
        onClose={() => setIsTestimonialFormOpen(false)}
      />
    </div>
  );
}
