import {
  PrismaClient,
  Prisma,
  type User,
  type Destination,
  type Category,
  type Circuit,
  type Testimonial,
  type BlogCategory,
  type BlogPost,
  type Service,
  type Booking,
  type ContactRequest,
  type Setting,
  type MediaFile,
  type PasswordResetToken,
} from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 exige un driver adapter : on utilise pg.
// ⚠️ node-pg ≠ libpq : quand l'URI contient sslmode=require/prefer,
// pg-connection-string produit ssl={} (vérification stricte) et pg fait
// Object.assign(config, parse(connectionString)) — ce ssl={} ÉCRASE celui
// du config externe (cf. pg/lib/connection-parameters.js). Or libpq chiffre
// sans vérifier la chaîne pour require (CA managée type Aiven).
// → on retire sslmode de l'URI et on fixe ssl explicitement ici.
const dbUrl = process.env.DATABASE_URL ?? "";
const url = dbUrl ? new URL(dbUrl) : null;
const sslmode = url?.searchParams.get("sslmode") ?? null;
const relaxSsl = sslmode === "require" || sslmode === "prefer";
if (url && relaxSsl) url.searchParams.delete("sslmode");
const adapter = new PrismaPg({
  connectionString: url ? url.toString() : dbUrl,
  ...(relaxSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // L'établissement d'une connexion Aiven à froid prend 2 à ~5 s (TLS
    // + round-trip). Le maxWait par défaut de $transaction (2 s) expirait
    // avant même la première connexion → « Unable to start a transaction
    // in the given time ». On relève les seuils globalement pour couvrir
    // tous les services sans options par appel.
    transactionOptions: { maxWait: 15_000, timeout: 30_000 },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ré-exports pratiques pour la couche services.
export { Prisma };
export const { DbNull, JsonNull } = Prisma;
export type {
  User,
  Destination,
  Category,
  Circuit,
  Testimonial,
  BlogCategory,
  BlogPost,
  Service,
  Booking,
  ContactRequest,
  Setting,
  MediaFile,
  PasswordResetToken,
};
