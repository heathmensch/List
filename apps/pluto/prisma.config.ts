// Config for the Prisma CLI (migrate, generate, studio), not for Nest at
// request time. The running API reads DATABASE_URL (transaction pooler) in
// PrismaService. Migrations need a session-mode connection, so the CLI uses
// DIRECT_URL. Prisma 7 does not accept url/directUrl inside schema.prisma.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
