export const SITE_CONFIG = {
  name: "Wonder Tours and Services",
  description: "Découvrez le Bénin, le Togo et le Ghana à travers des expériences authentiques avec plus de 20 ans d'expertise touristique.",
  descriptionEn: "Discover Benin, Togo and Ghana through authentic experiences with over 20 years of tourism expertise.",
  url: "https://wondertoursandservices.com",
  ogImage: "/og-image.jpg",
  links: {
    whatsapp: "https://wa.me/22990000000",
    facebook: "https://facebook.com/wondertours",
    instagram: "https://instagram.com/wondertours",
    youtube: "https://youtube.com/@wondertours",
  },
  contact: {
    email: "contact@wondertoursandservices.com",
    phone: "+229 97 00 00 00",
    address: "Ouidah, Bénin",
  },
  founder: {
    name: "Eric Sylvestre BOKOSSA",
    title: "Fondateur",
  },
  map: {
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.1234567890123!2d2.1234567890123456!3d6.1234567890123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMDcnMjMuMCJOIDLCsDA3JzI0LjAiRQ!5e0!3m2!1sfr!2sbj!4v1234567890123!5m2!1sfr!2sbj",
  },
} as const;

export const NAVIGATION = [
  { name: "Accueil", nameEn: "Home", href: "/" },
  { name: "À propos", nameEn: "About", href: "/a-propos" },
  { name: "Circuits", nameEn: "Tours", href: "/circuits" },
  { name: "Séjours", nameEn: "Stays", href: "/sejours" },
  { name: "Hôtels", nameEn: "Hotels", href: "/hotels" },
  { name: "Témoignages", nameEn: "Testimonials", href: "/temoignages" },
  { name: "Blog", nameEn: "Blog", href: "/blog" },
  { name: "Contact", nameEn: "Contact", href: "/contact" },
] as const;

export const SERVICES = [
  {
    id: 1,
    title: "Circuits touristiques",
    titleEn: "Guided tours",
    description: "Découvrez le Bénin, le Togo et le Ghana à travers des circuits soigneusement conçus.",
    descriptionEn: "Discover Benin, Togo and Ghana through carefully designed tours.",
    icon: "Map",
    href: "/circuits",
  },
  {
    id: 2,
    title: "Organisation de séjours",
    titleEn: "Stay planning",
    description: "Une prise en charge adaptée à votre voyage.",
    descriptionEn: "Support tailored to your trip.",
    icon: "Calendar",
    href: "/sejours",
  },
  {
    id: 3,
    title: "Réservation d'hôtels",
    titleEn: "Hotel bookings",
    description: "Trouvez et réservez votre hébergement avec assistance.",
    descriptionEn: "Find and book your accommodation with assistance.",
    icon: "Building2",
    href: "/hotels",
  },
  {
    id: 4,
    title: "Accompagnement touristique",
    titleEn: "Travel assistance",
    description: "Bénéficiez de conseils et d'un accompagnement personnalisé.",
    descriptionEn: "Benefit from advice and personalized support.",
    icon: "User",
    href: "/contact",
  },
] as const;

export const WHY_CHOOSE_US = [
  {
    id: 1,
    title: "20+ ans d'expérience",
    titleEn: "20+ years of experience",
    description: "Une expertise construite au fil de nombreuses années.",
    descriptionEn: "Expertise built over many years.",
  },
  {
    id: 2,
    title: "Expériences authentiques",
    titleEn: "Authentic experiences",
    description: "Découvrir le pays au-delà des parcours touristiques classiques.",
    descriptionEn: "Discover the country beyond classic tourist routes.",
  },
  {
    id: 3,
    title: "Accompagnement personnalisé",
    titleEn: "Personalized support",
    description: "Des solutions adaptées aux besoins de chaque voyageur.",
    descriptionEn: "Solutions tailored to every traveler's needs.",
  },
  {
    id: 4,
    title: "Expertise locale",
    titleEn: "Local expertise",
    description: "Une connaissance approfondie des destinations et du patrimoine du Bénin, du Togo et du Ghana.",
    descriptionEn: "In-depth knowledge of Benin's, Togo's and Ghana's destinations and heritage.",
  },
] as const;

export const DESTINATIONS = [
  "Ouidah",
  "Abomey",
  "Porto-Novo",
  "Cotonou",
  "Ganvié",
  "Grand-Popo",
] as const;

export const CATEGORIES = [
  "Culture",
  "Histoire",
  "Patrimoine",
  "Nature",
  "Vodoun",
  "Littoral",
  "Expérience locale",
] as const;
