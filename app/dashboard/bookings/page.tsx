"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { matchesQuery, useApiData } from "@/lib/api-client";
import { BookingRowActions } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import { formatDate, formatFcfa } from "@/lib/format";
import type { ApiBooking, ApiPage } from "@/lib/api-types";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

export default function BookingsPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiBooking>>(
    "/api/dashboard/bookings?pageSize=100"
  );
  const [q, setQ] = useState("");

  const bookings = (data?.items ?? []).filter((booking) =>
    matchesQuery(q, booking.customerName, booking.customerEmail, booking.bookingReference)
  );
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Réservations</h1>
        <p className="text-gray-600 mt-1">
          {total} réservation{total > 1 ? "s" : ""}
        </p>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          {/* Recherche : filtre local sur la liste chargée. */}
          <Card>
            <CardContent className="p-4">
              <SearchInput
                placeholder="Rechercher une réservation (client, email, référence)…"
                value={q}
                onChange={setQ}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Circuit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Aucune réservation.
                      </td>
                    </tr>
                  )}
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {booking.bookingReference}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{booking.customerName}</p>
                            <p className="text-sm text-gray-500">{booking.customerEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {booking.circuit?.title ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{formatDate(booking.travelDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{booking.participants ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {booking.totalPrice !== null
                          ? formatFcfa(Number(booking.totalPrice))
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
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
                          {STATUS_LABELS[booking.status] ?? booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <BookingRowActions id={booking.id} onChanged={reload} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
