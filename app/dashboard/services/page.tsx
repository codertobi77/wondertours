"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";
import { matchesQuery, useApiData } from "@/lib/api-client";
import { RowActions, ToggleFieldButton } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import type { ApiPage, ApiService } from "@/lib/api-types";

export default function ServicesPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiService>>(
    "/api/dashboard/services?pageSize=100"
  );
  const [q, setQ] = useState("");

  const services = (data?.items ?? []).filter((service) =>
    matchesQuery(q, service.title, service.description ?? "")
  );
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            {total} service{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/dashboard/services/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau service
        </Button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          {/* Recherche : filtre local sur la liste chargée. */}
          <Card>
            <CardContent className="p-4">
              <SearchInput placeholder="Rechercher un service…" value={q} onChange={setQ} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="p-8 text-center text-gray-500">
                  Aucun service.
                </CardContent>
              </Card>
            )}
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.title}</h3>
                        <p className="text-sm text-gray-600">{service.href ?? "—"}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        service.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.isActive ? "active" : "inactive"}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <ToggleFieldButton
                      resource="services"
                      id={service.id}
                      value={service.isActive}
                      onChanged={reload}
                    />
                    <span className="flex-1" />
                    <RowActions
                      id={service.id}
                      resource="services"
                      editHref={`/dashboard/services/${service.id}`}
                      enableDelete
                      deleteLabel="Supprimer le service"
                      confirmMessage={`Supprimer le service « ${service.title} » ?`}
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
