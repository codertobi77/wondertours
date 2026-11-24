/**
 * Construction du driver adapter MariaDB (Prisma 7) — partagée par le client
 * applicatif (`lib/db.ts`) et le seed (`prisma/seed.ts`).
 *
 * Équivalent MySQL de lib/pg-adapter.ts pour la migration vers LWS Perso.
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export function createMariadbAdapter(
  connectionString = process.env.DATABASE_URL ?? "",
): PrismaMariaDb {
  const url = connectionString ? new URL(connectionString) : null;

  return new PrismaMariaDb({
    host: url?.hostname ?? "localhost",
    port: url ? Number(url.port) || 3306 : 3306,
    user: url ? decodeURIComponent(url.username) : "",
    password: url ? decodeURIComponent(url.password) : "",
    database: url ? url.pathname.replace(/^\//, "") : "",
    connectionLimit: Number(process.env.DATABASE_POOL_MAX ?? "5") || 5,
  });
}
