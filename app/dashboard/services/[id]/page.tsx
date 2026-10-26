import EditClient from "./edit-client";

/**
 * Coquille statique : identifiant réel lu côté client via useParams.
 * Export statique -> page sentinelle "_" que le .htaccess sert pour
 * tous les UUID (rewrite /dashboard/<res>/_.html).
 */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <EditClient />;
}
