/**
 * Construction du driver adapter pg (Prisma 7) — partagée par le client
 * applicatif (`lib/db.ts`) et le seed (`prisma/seed.ts`).
 */
import { PrismaPg } from "@prisma/adapter-pg";

export function createPgAdapter(
  connectionString = process.env.DATABASE_URL ?? "",
): PrismaPg {
  // ⚠️ node-pg ≠ libpq : quand l'URI contient sslmode=require/prefer,
  // pg-connection-string produit ssl={} (vérification stricte) et pg fait
  // Object.assign(config, parse(connectionString)) — ce ssl={} ÉCRASE celui
  // du config externe (cf. pg/lib/connection-parameters.js). Or libpq chiffre
  // sans vérifier la chaîne pour require (CA managée type Aiven).
  // → on retire sslmode de l'URI et on fixe ssl explicitement ici.
  //
  // On retire aussi connection_limit/pool_timeout (sémantique Prisma 6,
  // comprise du seul client Rust historique) : node-pg les ignore et
  // libpq/psql les rejette (« invalid URI query parameter »).
  const url = connectionString ? new URL(connectionString) : null;
  url?.searchParams.delete("connection_limit");
  url?.searchParams.delete("pool_timeout");
  const sslmode = url?.searchParams.get("sslmode") ?? null;
  const relaxSsl = sslmode === "require" || sslmode === "prefer";
  if (url && relaxSsl) url.searchParams.delete("sslmode");

  // Plafond de connexions serveur ouvertes par CE process.
  // Aiven Hobbyist : max_connections = 20, dont 3 réservés aux superusers et
  // ~13 consommés par les workers Aiven (pg_cron, TimescaleDB, management…)
  // → ~5 slots réels, partagés par tous les clients de la base (Vercel,
  // standalone LWS, seed, psql). Sans `max`, node-pg monte à 10 par pool →
  // « Too many database connections opened » (P2037). Ajustable via
  // DATABASE_POOL_MAX sans rebuild.
  const max = Number(process.env.DATABASE_POOL_MAX ?? "2") || 2;

  return new PrismaPg({
    connectionString: url ? url.toString() : connectionString,
    max,
    // Pool saturé : attendre ~10 s puis échouer proprement (P2024) plutôt
    // que de bloquer indéfiniment. Couvre aussi l'établissement Aiven à
    // froid (2 à ~5 s, TLS + RTT).
    connectionTimeoutMillis: 10_000,
    // Identifier les connexions de l'app dans pg_stat_activity (sinon vide).
    application_name: "wondertours-web",
    ...(relaxSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}
