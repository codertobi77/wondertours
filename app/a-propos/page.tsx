import { AboutContent } from "@/components/about/about-content";
import { generateMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/lib/content";

export const metadata = generateMetadata({
  title: "À propos - Wonder Tours and Services",
  description: "Découvrez Wonder Tours and Services, plus de 20 ans d'expertise touristique au Bénin, au Togo et au Ghana. Notre histoire, nos valeurs et notre vision du tourisme authentique.",
  path: "/a-propos"
});

// Page statique : la biographie du fondateur vient de la table settings via
// l'API PHP (liste blanche publique /api/settings), figée au build.
export default async function AboutPage() {
  const settings = await getPublicSettings();

  return (
    <AboutContent
      founderBioFr={settings["founder_bio_fr"]?.trim() || null}
      founderBioEn={settings["founder_bio_en"]?.trim() || null}
    />
  );
}
