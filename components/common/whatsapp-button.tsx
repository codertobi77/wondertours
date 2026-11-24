"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  className?: string;
}

export function WhatsAppButton({ className }: WhatsAppButtonProps) {
  const [href, setHref] = useState<string>(SITE_CONFIG.links.whatsapp);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (cancelled || !result) return;
        const items = Array.isArray(result.items) ? result.items : [];
        const map: Record<string, string> = {};
        for (const item of items) {
          if (item && typeof item.key === "string" && item.value !== null) {
            map[item.key] = item.value;
          }
        }
        if (map.whatsapp_number) {
          setHref(map.whatsapp_number);
        }
      })
      .catch(() => {
        // graceful degradation: keep static value
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-6 right-6 z-50 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 hover:scale-110 flex items-center space-x-2 group",
        className
      )}
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden md:inline font-medium">WhatsApp</span>
    </a>
  );
}
