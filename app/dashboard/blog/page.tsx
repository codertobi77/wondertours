"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Eye } from "lucide-react";
import { matchesQuery, useApiData } from "@/lib/api-client";
import { RowActions, ToggleFieldButton } from "@/components/dashboard/row-actions";
import { SearchInput } from "@/components/dashboard/search-input";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import { formatDate } from "@/lib/format";
import type { ApiBlogPost, ApiPage } from "@/lib/api-types";

export default function BlogPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiBlogPost>>(
    "/api/dashboard/blog?pageSize=100"
  );
  const [q, setQ] = useState("");

  const posts = (data?.items ?? []).filter((post) =>
    matchesQuery(q, post.title, post.excerpt ?? "")
  );
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-600 mt-1">
            {total} article{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/dashboard/blog/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          {/* Recherche : filtre local sur la liste chargée. */}
          <Card>
            <CardContent className="p-4">
              <SearchInput placeholder="Rechercher un article…" value={q} onChange={setQ} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Publié le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vues
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
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucun article.
                      </td>
                    </tr>
                  )}
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{post.title}</p>
                          {post.isFeatured && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 mt-1">
                              À la une
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {post.category?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(post.publishedAt ?? post.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="w-4 h-4 text-gray-400" />
                          {post.views}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            post.isPublished
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {post.isPublished ? "publié" : "brouillon"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <ToggleFieldButton
                            resource="blog"
                            id={post.id}
                            field="isPublished"
                            value={post.isPublished}
                            activeTitle="Dépublier"
                            inactiveTitle="Publier"
                            onChanged={reload}
                          />
                          <RowActions
                            id={post.id}
                            resource="blog"
                            editHref={`/dashboard/blog/${post.id}`}
                            enableDelete
                            deleteLabel="Supprimer l'article"
                            confirmMessage={`Supprimer l'article « ${post.title} » ?`}
                            onChanged={reload}
                          />
                        </div>
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
