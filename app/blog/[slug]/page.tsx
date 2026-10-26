import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewCounter } from "@/components/common/view-counter";
import { getBlogCategories, getBlogPost, getBlogPosts, getBlogSlugs } from "@/lib/content";
import { Calendar, Clock, Share2 } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Export statique : une page HTML par article publié au build.
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  // Export statique : Next refuse un tableau vide (au moins une route
  // générée). Sentinelle "_" si le contenu est indisponible au build
  // (CI sans APP_URL, API coupée) : la page rend alors not-found, aucun
  // contenu fictif n'est pas publié.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "_" }];
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} - Wonder Tours and Services`,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Le compteur de vues vit dans l'API PHP (GET /api/blog/{slug}) :
  // une incrémentation au build (fetch mémoïsé) + une par visite via
  // <ViewCounter> côté navigateur.
  const [allPosts, categories] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
  ]);

  // Articles similaires : même catégorie, hors article courant (3 max).
  const related = allPosts
    .filter(
      (candidate) =>
        candidate.categorySlug === post.categorySlug && candidate.id !== post.id
    )
    .slice(0, 3);

  // Données de la sidebar : articles récents + catégories avec compteurs.
  const recentPosts = allPosts
    .filter((candidate) => candidate.id !== post.id)
    .slice(0, 5);
  const categoryCounts = new Map<string, number>();
  for (const item of allPosts) {
    if (item.categorySlug) {
      categoryCounts.set(
        item.categorySlug,
        (categoryCounts.get(item.categorySlug) ?? 0) + 1
      );
    }
  }
  const sidebarCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    count: categoryCounts.get(category.slug) ?? 0,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ViewCounter slug={slug} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative h-[50vh] min-h-[400px]">
          <img
            src={post.image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 lg:px-8 pb-12">
            <Badge variant="secondary" className="mb-4">{post.category}</Badge>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-white">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {new Date(post.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {post.readTime}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <article className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="prose prose-lg max-w-none">
                  <p className="text-text-secondary text-xl leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                  <div className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {post.content}
                  </div>
                </div>

                {/* Share */}
                <div className="flex items-center gap-4 mt-12 pt-8 border-t">
                  <span className="text-text font-medium">Partager :</span>
                  <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                    <Share2 className="w-5 h-5" />
                    Copier le lien
                  </button>
                </div>

                {/* Comments Section */}
                <div className="mt-12 pt-8 border-t">
                  <h3 className="font-heading text-2xl font-bold text-text mb-6">
                    Laisser un commentaire
                  </h3>
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-text mb-2">
                        Commentaire
                      </label>
                      <textarea
                        id="comment"
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                        placeholder="Votre commentaire..."
                      />
                    </div>
                    <Button variant="primary" type="submit">
                      Envoyer le commentaire
                    </Button>
                  </form>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1 space-y-8">
                {/* Recent Posts */}
                <div className="bg-background p-6 rounded-xl">
                  <h3 className="font-heading text-xl font-bold text-text mb-4">
                    Articles récents
                  </h3>
                  <div className="space-y-4">
                    {recentPosts.map((recentPost) => (
                      <Link
                        key={recentPost.id}
                        href={`/blog/${recentPost.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          <img
                            src={recentPost.image}
                            alt={recentPost.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h4 className="font-medium text-text text-sm group-hover:text-primary transition-colors line-clamp-2">
                              {recentPost.title}
                            </h4>
                            <p className="text-text-secondary text-xs mt-1">
                              {new Date(recentPost.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-background p-6 rounded-xl">
                  <h3 className="font-heading text-xl font-bold text-text mb-4">
                    Catégories
                  </h3>
                  <div className="space-y-2">
                    {sidebarCategories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/blog?categorie=${encodeURIComponent(category.slug)}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-primary/10 transition-colors group"
                      >
                        <span className="text-text-secondary group-hover:text-primary transition-colors">
                          {category.name}
                        </span>
                        <span className="text-text-secondary text-sm">
                          {category.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <SectionHeading
                title="Articles similaires"
              />
              <div className="grid md:grid-cols-3 gap-8">
                {related.map((relatedPost) => (
                  <div key={relatedPost.id} className="bg-white rounded-xl overflow-hidden shadow-md">
                    <img
                      src={relatedPost.image}
                      alt={relatedPost.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <Badge variant="secondary" className="mb-3">{relatedPost.category}</Badge>
                      <h3 className="font-heading text-lg font-bold text-text mb-2">
                        {relatedPost.title}
                      </h3>
                      <Button variant="outline" size="sm" href={`/blog/${relatedPost.slug}`} className="w-full">
                        Lire l&apos;article
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <SectionHeading
              title="Prêt à découvrir le Bénin ?"
            />
            <p className="text-text-secondary text-xl mb-8 max-w-2xl mx-auto">
              Laissez-nous vous accompagner dans la préparation de votre voyage.
            </p>
            <Button variant="primary" size="lg" href="/contact">
              Planifier mon voyage
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
