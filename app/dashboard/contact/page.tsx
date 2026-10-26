"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { matchesQuery, useApiData } from "@/lib/api-client";
import { ContactRowActions } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import { formatDate } from "@/lib/format";
import type { ApiContactRequest, ApiPage } from "@/lib/api-types";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  in_progress: "En cours",
  answered: "Répondue",
  closed: "Clôturée",
};

export default function ContactPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiContactRequest>>(
    "/api/dashboard/contact-requests?pageSize=100"
  );
  const [q, setQ] = useState("");

  const requests = (data?.items ?? []).filter((request) =>
    matchesQuery(q, request.name, request.email, request.subject ?? "")
  );
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Demandes de contact</h1>
        <p className="text-gray-600 mt-1">
          {total} demande{total > 1 ? "s" : ""}
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
                placeholder="Rechercher une demande (nom, email, sujet)…"
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sujet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reçue le
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
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucune demande de contact.
                      </td>
                    </tr>
                  )}
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{request.name}</p>
                            <p className="text-sm text-gray-500">{request.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{request.subject}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">
                        {request.requestType}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4">
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
                          {STATUS_LABELS[request.status] ?? request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ContactRowActions id={request.id} onChanged={reload} />
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
