import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { listCircuits } from "@/lib/services/circuits";
import { RowActions, ToggleFieldButton } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { formatFcfa } from "@/lib/format";

export const dynamic = "force-dynamic";

/** durationDays → "2 jours" ; null → "Sur mesure". */
function formatDuration(days: number | null): string {
  if (!days || days < 1) return "Sur mesure";
  return `${days} jour${days > 1 ? "s" : ""}`;
}

interface CircuitsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CircuitsPage({ searchParams }: CircuitsPageProps) {
  const filters = await searchParams;
  const q = typeof filters.q === "string" ? filters.q : undefined;
  const { items: circuits, total } = await listCircuits({ pageSize: 100, q });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Circuits</h1>
          <p className="text-gray-600 mt-1">
            {total} circuit{total > 1 ? "s" : ""} en base
          </p>
        </div>
        <Button href="/dashboard/circuits/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau circuit
        </Button>
      </div>

      {/* Recherche : met à jour ?q=, la page serveur refiltre. */}
      <Card>
        <CardContent className="p-4">
          <SearchInput placeholder="Rechercher un circuit…" />
        </CardContent>
      </Card>

      {/* Circuits List */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Circuit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
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
              {circuits.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucun circuit en base. Créez le premier !
                  </td>
                </tr>
              )}
              {circuits.map((circuit) => (
                <tr key={circuit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{circuit.title}</p>
                        {circuit.isFeatured && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 mt-1">
                            À la une
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {circuit.destination?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {circuit.categories.map((c) => c.name).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDuration(circuit.durationDays)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatFcfa(Number(circuit.price))}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        circuit.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {circuit.isActive ? "actif" : "inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <ToggleFieldButton
                        resource="circuits"
                        id={circuit.id}
                        value={circuit.isActive}
                      />
                      <RowActions
                        id={circuit.id}
                        resource="circuits"
                        editHref={`/dashboard/circuits/${circuit.id}`}
                        enableDelete
                        deleteLabel="Supprimer le circuit"
                        confirmMessage={`Supprimer le circuit « ${circuit.title} » ?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
