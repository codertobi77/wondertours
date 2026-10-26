"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { matchesQuery, useApiData } from "@/lib/api-client";
import { SearchInput } from "@/components/dashboard/search-input";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import {
  MediaUploader,
  MediaCardActions,
  MediaAltTextEditor,
} from "@/components/dashboard/media-actions";
import { formatDate, formatFileSize } from "@/lib/format";
import type { ApiMediaFile, ApiPage } from "@/lib/api-types";

export default function MediaPage() {
  const { data, error, loading, reload } = useApiData<ApiPage<ApiMediaFile>>(
    "/api/dashboard/media?pageSize=100"
  );
  const [q, setQ] = useState("");

  const files = (data?.items ?? []).filter((file) =>
    matchesQuery(q, file.filename, file.altText ?? "", file.altTextEn ?? "")
  );
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Médiathèque</h1>
        <p className="text-gray-600 mt-1">
          {total} fichier{total > 1 ? "s" : ""}
        </p>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          <MediaUploader onChanged={reload} />

          {/* Recherche : filtre local sur la liste chargée. */}
          <Card>
            <CardContent className="p-4">
              <SearchInput placeholder="Rechercher un fichier…" value={q} onChange={setQ} />
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
                        {formatFileSize(Number(file.size))} • {formatDate(file.createdAt)}
                      </p>
                      <MediaAltTextEditor
                        id={file.id}
                        altText={file.altText}
                        altTextEn={file.altTextEn}
                        onChanged={reload}
                      />
                    </div>
                    <MediaCardActions id={file.id} url={file.url} onChanged={reload} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
