// Config for the Prisma CLI (migrate, generate, studio), not for Nest at
// request time. The running API reads DATABASE_URL (transaction pooler) in
// PrismaService. Migrations need a session-mode connection, so the CLI uses
// DIRECT_URL. Prisma 7 does not accept url/directUrl inside schema.prisma.
//
// `prisma generate` only needs a placeholder URL; real DIRECT_URL is required
// for migrate/studio. Avoid hard-failing when Takeoff's monorepo install
// touches this package without DB env vars.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DIRECT_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/lists",
  },
});
