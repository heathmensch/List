// Config for the Prisma CLI (migrate, generate, studio), not for Express at
// request time. The running API still reads DATABASE_URL itself in src/lib/prisma.ts.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Same DATABASE_URL as in apps/pluto/.env
    url: env("DATABASE_URL"),
  },
});
