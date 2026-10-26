"use client";

import { useApiData } from "@/lib/api-client";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { ErrorBlock, LoadingBlock } from "@/components/dashboard/api-state";
import type { ApiSetting } from "@/lib/api-types";

/** GET /api/dashboard/settings : {items} SANS enveloppe de pagination. */
interface SettingsPayload {
  items: ApiSetting[];
}

export default function SettingsPage() {
  const { data, error, loading } = useApiData<SettingsPayload>(
    "/api/dashboard/settings"
  );

  const initial = Object.fromEntries(
    (data?.items ?? [])
      .filter((setting) => setting.value !== null)
      .map((setting) => [setting.key, setting.value as string])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configurez les paramètres du site</p>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}
      {/* Le formulaire n'est monté qu'une fois les valeurs chargées :
          son useState(initial) capture l'état initial au premier rendu. */}
      {!loading && !error && <SettingsForm initial={initial} />}
    </div>
  );
}
