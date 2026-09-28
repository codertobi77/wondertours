import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/constants";
import { generateMetadata } from "@/lib/seo";
import { LanguageProvider } from "@/contexts/language-context";
import { ReservationsProvider } from "@/contexts/reservations-context";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = generateMetadata({
  icons: {
    icon: "/croquis.png",
    apple: "/croquis.png",
  },
})

// Données structurées Schema.org pour l'organisation
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  telephone: SITE_CONFIG.contact.phone,
  email: SITE_CONFIG.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_CONFIG.contact.address,
    addressCountry: "BJ",
  },
  sameAs: [
    SITE_CONFIG.links.facebook,
    SITE_CONFIG.links.instagram,
    SITE_CONFIG.links.whatsapp,
  ].filter(Boolean),
  priceRange: "$$",
  areaServed: ["Bénin", "Togo", "Ghana", "Benin", "Togo", "Ghana"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" type="image/png" href="/croquis.png"></link>
      </head>
      <body className="min-h-full flex flex-col">
        <ReservationsProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ReservationsProvider>
      </body>
    </html>
  );
}
