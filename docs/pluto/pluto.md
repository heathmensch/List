# Pluto

Pluto is the backend. It is an Express server that talks to PostgreSQL through Prisma.

Most day-to-day work happens in two places: `prisma/` (the database shape) and `src/` (the server and routes).

```
apps/pluto
  prisma/             Database schema
  src/                Server code
  prisma.config.ts    Tells Prisma where the schema and database URL live
  .env                Local secrets (not committed)
  .env.example        Copy this if you need a new .env
  package.json        Scripts: dev, build, prisma migrate/generate
```

You can ignore `node_modules/`, `dist/`, and `src/generated/`. Those are installed or generated, not hand-edited.

---

---

## `prisma/`

This folder is the source of truth for the database.

| File            | Why you care                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `schema.prisma` | Define tables (models) here. After you change it, run `pnpm db:migrate` and `pnpm db:generate` from the repo root. |

When you migrate, Prisma will also create a `prisma/migrations/` folder. You usually do not edit those SQL files by hand unless you are fixing a migration.

---

---

## `src/`

This is the running API.

| Path            | Why you care                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`      | Starts the server, sets up CORS and JSON parsing, and defines routes. New endpoints go here (or in files you add and then hook up from here). |
| `lib/prisma.ts` | Creates the shared database client. Import `prisma` from this file when a route needs to read or write data.                                  |

Right now the only route is `GET /health`, which checks that the API and database are up.

---

---

## Files at this level you might still open

| File               | Why you care                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `prisma.config.ts` | Points Prisma at `schema.prisma` and `DATABASE_URL`. You rarely change this.                   |
| `.env`             | `DATABASE_URL`, `PORT`, and `CORS_ORIGIN` for local development.                               |
| `package.json`     | Scripts for running the server and Prisma. Prefer the root `pnpm` commands in the main README. |
