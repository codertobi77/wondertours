import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import { listCategories } from "@/lib/services/categories";
import { RowActions, ToggleFieldButton } from "@/components/dashboard/row-actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { items: categories, total } = await listCategories({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
          <p className="text-gray-600 mt-1">
            {total} catégorie{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/dashboard/categories/new">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-gray-500">
              Aucune catégorie.
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
                    <Tag
                      className="w-6 h-6"
                      style={{ color: category.color ?? "#3B82F6" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color ?? "#3B82F6" }}
                      />
                      <span className="text-xs text-gray-500">
                        {category.color ?? "—"}
                      </span>
                    </div>
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
              <div className="flex gap-2 items-center">
                <ToggleFieldButton
                  resource="categories"
                  id={category.id}
                  value={category.isActive}
                />
                <span className="flex-1" />
                <RowActions
                  id={category.id}
                  resource="categories"
                  editHref={`/dashboard/categories/${category.id}`}
                  enableDelete
                  deleteLabel="Supprimer la catégorie"
                  confirmMessage={`Supprimer la catégorie « ${category.name} » ?`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
