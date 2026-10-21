import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import { listUsers } from "@/lib/services/users";
import { RowActions } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { formatDate } from "@/lib/format";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

interface UsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  editor: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-800",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  editor: "Éditeur",
  viewer: "Lecteur",
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  // Gestion des comptes : admin uniquement. proxy.ts redirige déjà les
  // non-admins, ce contrôle serveur est la deuxième ligne de défense
  // (la page interroge Prisma directement, sans passer par l'API).
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const filters = await searchParams;
  const q = typeof filters.q === "string" ? filters.q : undefined;
  const { items: users, total } = await listUsers({ pageSize: 100, q });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            {total} utilisateur{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/dashboard/users/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput placeholder="Rechercher un utilisateur…" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        ROLE_STYLES[user.role] ?? ROLE_STYLES.viewer
                      }`}
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "actif" : "désactivé"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <RowActions
                        id={user.id}
                        resource="users"
                        editHref={`/dashboard/users/${user.id}`}
                        enableDelete
                        deleteLabel="Supprimer l'utilisateur"
                        confirmMessage={`Supprimer l'utilisateur ${user.firstName} ${user.lastName} ?`}
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
