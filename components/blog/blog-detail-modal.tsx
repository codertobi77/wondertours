"use client";

import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Share2 } from "lucide-react";
import { BlogPost } from "@/lib/data/blog";
import { useLanguage } from "@/contexts/language-context";

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost;
}

export function BlogDetailModal({ isOpen, onClose, post }: BlogDetailModalProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";

  // Champs FR avec repli automatique sur la traduction EN quand la
  // colonne En n'est pas renseignée en base.
  const title = isFr ? post.title : post.titleEn || post.title;
  const category = isFr ? post.category : post.categoryEn || post.category;
  const excerpt = isFr ? post.excerpt : post.excerptEn || post.excerpt;
  const content = isFr ? post.content : post.contentEn || post.content;
  const readTime = isFr ? post.readTime : post.readTimeEn || post.readTime;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="relative h-64 md:h-80">
        <img
          src={post.image}
          alt={title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge variant="secondary" className="mb-3">{category}</Badge>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            {title}
          </h2>
          <div className="flex flex-wrap gap-4 text-white text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(post.date).toLocaleDateString(
                locale === "fr" ? "fr-FR" : "en-US",
                {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }
              )}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {readTime}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="prose prose-lg max-w-none">
          <p className="text-text-secondary text-xl leading-relaxed mb-6">
            {excerpt}
          </p>
          <div className="text-text-secondary leading-relaxed">
            {content}
          </div>
        </div>

        {/* Share */}
        <div className="flex items-center gap-4 mt-12 pt-8 border-t">
          <span className="text-text font-medium">{isFr ? "Partager :" : "Share:"}</span>
          <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
            <Share2 className="w-5 h-5" />
            {isFr ? "Copier le lien" : "Copy link"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
