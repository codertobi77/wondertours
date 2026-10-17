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
import { createPgAdapter } from "@/lib/pg-adapter";

// Prisma 7 exige un driver adapter pg. La construction (TLS Aiven, retrait
// des paramètres Prisma 6 ignorés par node-pg, plafond DATABASE_POOL_MAX)
// est partagée avec le seed — cf. lib/pg-adapter.ts.
const adapter = createPgAdapter();

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
