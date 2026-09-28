"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NAVIGATION, SITE_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { ReservationsSidebar } from "@/components/common/reservations-sidebar";
import { useReservations } from "@/contexts/reservations-context";

export function Header() {
  const { locale, setLocale, t } = useLanguage();
  const { reservations } = useReservations();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReservationsOpen, setIsReservationsOpen] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const handleCartClick = () => {
    setIsCartBouncing(true);
    setTimeout(() => {
      setIsCartBouncing(false);
      setIsReservationsOpen(true);
    }, 300);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-amber-600/95 backdrop-blur-md shadow-md"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/Logo_wonder_blanc.png"
              alt="Wonder Tours and Services"
              className="h-15 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "hover:text-white transition-colors font-medium relative",
                  isScrolled ? "text-white/80" : "text-white",
                  pathname === item.href && "text-white"
                )}
              >
                {pathname === item.href && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full" />
                )}
                {locale === "fr" ? item.name : item.nameEn}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={handleCartClick}
              className={cn(
                "relative flex items-center space-x-2 hover:text-white transition-all duration-300",
                isCartBouncing ? "animate-bounce" : "",
                isScrolled ? "text-white" : "text-white"
              )}
            >
              <ShoppingCart className="w-6 h-6" />
              {reservations.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {reservations.length}
                </span>
              )}
            </button>
          </div>

          {/* Language Switcher */}
          <div className={cn(
            "hidden lg:flex items-center space-x-2 pl-4",
            isScrolled ? "border-l border-white/30" : "border-l border-white/30"
          )}>
            <button
              onClick={() => setLocale("fr")}
              className={cn(
                "font-medium transition-all duration-300 hover:animate-bounce",
                locale === "fr" ? "text-white font-bold" : "text-white/70 hover:text-white"
              )}
            >FR</button>
            <span className={cn(
              isScrolled ? "text-white/70" : "text-white/70"
            )}>|</span>
            <button
              onClick={() => setLocale("en")}
              className={cn(
                "font-medium transition-all duration-300 hover:animate-bounce",
                locale === "en" ? "text-white font-bold" : "text-white/70 hover:text-white"
              )}
            >
              EN
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center space-x-3">
            <button
              onClick={handleCartClick}
              className={cn(
                "relative flex items-center space-x-2 text-white hover:text-white/80 transition-all duration-300",
                isCartBouncing ? "animate-bounce" : ""
              )}
            >
              <ShoppingCart className="w-6 h-6" />
              {reservations.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {reservations.length}
                </span>
              )}
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLocale("fr")}
                className={cn(
                  "font-medium transition-all duration-300 hover:animate-bounce",
                  locale === "fr" ? "text-white font-bold" : "text-white/70 hover:text-white"
                )}
              >FR</button>
              <span className="text-white/70">|</span>
              <button
                onClick={() => setLocale("en")}
                className={cn(
                  "font-medium transition-all duration-300 hover:animate-bounce",
                  locale === "en" ? "text-white font-bold" : "text-white/70 hover:text-white"
                )}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-amber-50 border-t overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={scrollLeft}
                  className="flex-shrink-0 p-2 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors text-amber-600"
                  aria-label="Défiler à gauche"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  ref={scrollContainerRef}
                  className="flex flex-row space-x-3 overflow-x-auto scrollbar-hide pb-2 flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {NAVIGATION.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (index * 0.05), duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex-shrink-0 font-medium py-3 px-4 rounded-lg transition-colors whitespace-nowrap",
                          pathname === item.href ? "bg-amber-600 text-white" : "text-text hover:bg-amber-100"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {locale === "fr" ? item.name : item.nameEn}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={scrollRight}
                  className="flex-shrink-0 p-2 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors text-amber-600"
                  aria-label="Défiler à droite"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reservations Sidebar */}
      <ReservationsSidebar
        isOpen={isReservationsOpen}
        onClose={() => setIsReservationsOpen(false)}
      />
    </header>
  );
}
