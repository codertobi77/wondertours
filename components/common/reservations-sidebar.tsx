"use client";

import { X, Trash2, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservations, ReservationItem } from "@/contexts/reservations-context";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { convertPrice, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ReservationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReservationsSidebar({ isOpen, onClose }: ReservationsSidebarProps) {
  const { reservations, removeReservation, clearReservations } = useReservations();
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const { currency: selectedCurrency } = useCurrency();

  const totalPrice = reservations.reduce((sum, item) => sum + convertPrice(item.price, item.currency ?? "XOF", selectedCurrency), 0);

  // Empêcher le défilement du body quand la sidebar est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-96 bg-amber-50 z-[51] shadow-2xl transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
        style={{ backdropFilter: 'blur(0px)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-primary p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl font-bold text-black">{isFr ? "Mes réservations" : "My bookings"}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-black"
                aria-label={isFr ? "Fermer" : "Close"}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-white/80 text-sm">
              {isFr
                ? `${reservations.length} réservation${reservations.length > 1 ? "s" : ""}`
                : `${reservations.length} booking${reservations.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'auto', msOverflowStyle: 'auto' }}>
            {reservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-text-secondary mb-4">
                  {isFr ? "Aucune réservation pour le moment" : "No bookings yet"}
                </p>
                <Button variant="outline" onClick={onClose}>
                  {isFr ? "Explorer nos circuits" : "Explore our tours"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((item) => (
                  <ReservationCard
                    key={item.id}
                    item={item}
                    onRemove={() => removeReservation(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {reservations.length > 0 && (
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-text">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(totalPrice, selectedCurrency)}
                </span>
              </div>
              <Button variant="primary" className="w-full mb-3" href="/contact">
                {isFr ? "Finaliser la réservation" : "Complete booking"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearReservations}
              >
                {isFr ? "Vider les réservations" : "Clear bookings"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ReservationCard({ item, onRemove }: { item: ReservationItem; onRemove: () => void }) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const { currency: selectedCurrency } = useCurrency();

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        <img
          src={item.image}
          alt={item.title}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-text mb-1 truncate">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <MapPin className="w-3 h-3" />
            <span className="capitalize">{item.type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">
              {formatPrice(convertPrice(item.price, item.currency ?? "XOF", selectedCurrency), selectedCurrency)}
            </span>
            <button
              onClick={onRemove}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              aria-label={isFr ? "Supprimer" : "Remove"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
