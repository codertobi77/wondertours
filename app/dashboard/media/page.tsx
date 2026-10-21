import { Card, CardContent } from "@/components/ui/card";
import { listMediaFiles } from "@/lib/services/media";
import { SearchInput } from "@/components/dashboard/search-input";
import {
  MediaUploader,
  MediaCardActions,
  MediaAltTextEditor,
} from "@/components/dashboard/media-actions";
import { formatDate, formatFileSize } from "@/lib/format";

export const dynamic = "force-dynamic";

interface MediaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const filters = await searchParams;
  const q = typeof filters.q === "string" ? filters.q : undefined;
  const { items: files, total } = await listMediaFiles({ pageSize: 100, q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Médiathèque</h1>
        <p className="text-gray-600 mt-1">
          {total} fichier{total > 1 ? "s" : ""}
        </p>
      </div>

      <MediaUploader />

      <Card>
        <CardContent className="p-4">
          <SearchInput placeholder="Rechercher un fichier…" />
        </CardContent>
      </Card>

      {files.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-8 text-center text-gray-500">
            Aucun fichier. Uploadez votre première image ci-dessus.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.altText ?? file.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900 text-sm truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                  </p>
                  <MediaAltTextEditor
                    id={file.id}
                    altText={file.altText}
                    altTextEn={file.altTextEn}
                  />
                </div>
                <MediaCardActions id={file.id} url={file.url} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
