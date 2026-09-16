// Shared Prisma client. Import `prisma` from here whenever a route needs the database.
// Prisma 7 talks to Postgres through a driver adapter: PrismaPg wraps a `pg` pool,
// and PrismaClient turns calls like prisma.user.findMany() into SQL over that pool.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Postgres connection URL from apps/pluto/.env (for example postgresql://user:pass@localhost:5432/dbname).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// tsx watch re-evaluates this module on save. Without a singleton, each reload
// would open another pool and leak connections. We hang the client on globalThis
// (the process-wide object) so later reloads reuse the first instance.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
