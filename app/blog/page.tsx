import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { LocalizedHero } from "@/components/common/localized-hero";
import { BlogPageContent } from "@/components/blog/blog-page-content";
import { getBlogCategories, getBlogPosts } from "@/lib/content";
import { generateMetadata } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "Blog - Wonder Tours and Services",
  description: "Carnet de voyage : conseils, culture et actualités pour préparer votre découverte du Bénin, du Togo et du Ghana. Articles sur le tourisme, la culture et les destinations.",
  path: "/blog"
});

// Page statique : tous les articles publiés sont embarqués au build, le
// filtre ?categorie= s'applique côté client dans BlogPageContent
// (useSearchParams exige le <Suspense> ci-dessous).
export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <LocalizedHero
          subtitle="CARNET DE VOYAGE"
          titleFr="Conseils, culture et actualités"
          titleEn="Tips, culture and news"
          descriptionFr="Découvrez nos articles pour préparer votre voyage au Bénin, au Togo ou au Ghana : conseils pratiques, découvertes culturelles et inspirations."
          descriptionEn="Discover our articles to prepare your trip to Benin, Togo or Ghana: practical tips, cultural discoveries and inspirations."
          ctaFr="Explorer les articles"
          ctaEn="Explore articles"
          ctaHref="#articles"
          image="/photos_site wonder_tours/IMG_20260315_173923_4.jpg"
        />

        {/* Corps bilingue (catégories, articles, newsletter) */}
        <Suspense fallback={null}>
          <BlogPageContent categories={categories} posts={posts} />
        </Suspense>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
