"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Map,
  Calendar,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useApiData } from "@/lib/api-client";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import { formatDate, formatFcfa } from "@/lib/format";
import type { ApiBooking, ApiContactRequest } from "@/lib/api-types";

/**
 * Agrégats + 5 dernières réservations/demandes, servis par
 * GET /api/dashboard/stats (tout rôle authentifié).
 */
interface DashboardStats {
  circuits: { total: number; active: number; featured: number };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    thisMonth: number;
    revenueThisMonth: number;
  };
  contactRequests: { total: number; new: number; inProgress: number };
  recentBookings: ApiBooking[];
  recentContactRequests: ApiContactRequest[];
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

const CONTACT_STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  in_progress: "En cours",
  answered: "Répondue",
  closed: "Clôturée",
};

export default function DashboardPage() {
  const { data: stats, error, loading } =
    useApiData<DashboardStats>("/api/dashboard/stats");

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!stats) return <ErrorBlock message="Statistiques indisponibles." />;

  const cards = [
    {
      title: "Circuits actifs",
      value: `${stats.circuits.active}`,
      hint: `${stats.circuits.total} au total, ${stats.circuits.featured} à la une`,
      icon: Map,
    },
    {
      title: "Réservations ce mois",
      value: `${stats.bookings.thisMonth}`,
      hint: `${stats.bookings.pending} en attente, ${stats.bookings.confirmed} confirmées`,
      icon: Calendar,
    },
    {
      title: "Demandes de contact",
      value: `${stats.contactRequests.total}`,
      hint: `${stats.contactRequests.new} nouvelles, ${stats.contactRequests.inProgress} en cours`,
      icon: MessageSquare,
    },
    {
      title: "Revenus ce mois",
      value: formatFcfa(stats.bookings.revenueThisMonth),
      hint: `${stats.bookings.total} réservations au total`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <card.icon className="w-5 h-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <p className="text-xs text-gray-500 mt-1">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Réservations récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentBookings.length === 0 && (
                <p className="text-sm text-gray-500">Aucune réservation pour le moment.</p>
              )}
              {stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {booking.circuit?.title ?? "Réservation sans circuit"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatDate(booking.travelDate)}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" href="/dashboard/bookings">
                Voir toutes les réservations
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Contact Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes de contact récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentContactRequests.length === 0 && (
                <p className="text-sm text-gray-500">Aucune demande de contact.</p>
              )}
              {stats.recentContactRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{request.name}</p>
                    <p className="text-sm text-gray-600">{request.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatDate(request.createdAt)}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        request.status === "new"
                          ? "bg-blue-100 text-blue-800"
                          : request.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "answered"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {CONTACT_STATUS_LABELS[request.status] ?? request.status}
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" href="/dashboard/contact">
                Voir toutes les demandes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" href="/dashboard/circuits/new">
              + Nouveau circuit
            </Button>
            <Button variant="outline" href="/dashboard/blog/new">
              + Nouvel article
            </Button>
            <Button variant="outline" href="/dashboard/destinations/new">
              + Nouvelle destination
            </Button>
            <Button variant="outline" href="/dashboard/settings">
              Paramètres
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
