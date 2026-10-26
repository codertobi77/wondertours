"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { matchesQuery, useApiData } from "@/lib/api-client";
import { RowActions, ToggleFieldButton } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import type { ApiDestination, ApiPage } from "@/lib/api-types";

export default function DestinationsPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiDestination>>(
    "/api/dashboard/destinations?pageSize=100"
  );
  const [q, setQ] = useState("");

  const destinations = (data?.items ?? []).filter((destination) =>
    matchesQuery(q, destination.name, destination.country ?? "")
  );
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Destinations</h1>
          <p className="text-gray-600 mt-1">
            {total} destination{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/dashboard/destinations/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle destination
        </Button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          {/* Recherche : filtre local sur la liste chargée. */}
          <Card>
            <CardContent className="p-4">
              <SearchInput placeholder="Rechercher une destination…" value={q} onChange={setQ} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-8 text-center text-gray-500">
                  Aucune destination.
                </CardContent>
              </Card>
            )}
            {destinations.map((destination) => (
              <Card key={destination.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                        <p className="text-sm text-gray-600">
                          {destination.region ?? destination.country ?? "—"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        destination.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {destination.isActive ? "active" : "inactive"}
                    </span>
                  </div>
                  {destination.country && (
                    <p className="text-sm text-gray-600 mb-4">{destination.country}</p>
                  )}
                  <div className="flex gap-2 items-center">
                    <ToggleFieldButton
                      resource="destinations"
                      id={destination.id}
                      value={destination.isActive}
                      onChanged={reload}
                    />
                    <span className="flex-1" />
                    <RowActions
                      id={destination.id}
                      resource="destinations"
                      editHref={`/dashboard/destinations/${destination.id}`}
                      enableDelete
                      deleteLabel="Supprimer la destination"
                      confirmMessage={`Supprimer la destination « ${destination.name} » ?`}
                      onChanged={reload}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
