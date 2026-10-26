"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tags } from "lucide-react";
import { useApiData } from "@/lib/api-client";
import { RowActions, ToggleFieldButton } from "@/components/dashboard/row-actions";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import type { ApiBlogCategory, ApiPage } from "@/lib/api-types";

export default function BlogCategoriesPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiBlogCategory>>(
    "/api/dashboard/blog-categories?pageSize=100"
  );

  const categories = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catégories de blog</h1>
          <p className="text-gray-600 mt-1">
            {total} catégorie{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/dashboard/blog-categories/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center text-gray-500">
                Aucune catégorie de blog.
              </CardContent>
            </Card>
          )}
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${category.color ?? "#3B82F6"}20`,
                      }}
                    >
                      <Tags
                        className="w-6 h-6"
                        style={{ color: category.color ?? "#3B82F6" }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <span className="text-xs text-gray-500">
                        {category.slug}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      category.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {category.isActive ? "active" : "inactive"}
                  </span>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="flex gap-2 items-center">
                  <ToggleFieldButton
                    resource="blog-categories"
                    id={category.id}
                    value={category.isActive}
                    onChanged={reload}
                  />
                  <span className="flex-1" />
                  <RowActions
                    id={category.id}
                    resource="blog-categories"
                    editHref={`/dashboard/blog-categories/${category.id}`}
                    enableDelete
                    deleteLabel="Supprimer la catégorie de blog"
                    confirmMessage={`Supprimer la catégorie de blog « ${category.name} » ?`}
                    onChanged={reload}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
