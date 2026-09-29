# Pluto

Pluto is the backend. It is an Express server that talks to PostgreSQL through Prisma.

Most day-to-day work happens in two places: `prisma/` (the database shape) and `src/` (the server and routes).

```
apps/pluto
  prisma/             Database schema + migrations
  src/                Server code
  prisma.config.ts    Tells Prisma where the schema and database URL live
  .env                Local secrets (not committed)
  .env.example        Copy this if you need a new .env
  package.json        Scripts: dev, build, prisma migrate/generate
```

You can ignore `node_modules/`, `dist/`, and `src/generated/`. Those are installed or generated, not hand-edited.

---

## `prisma/`

| File            | Why you care                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `schema.prisma` | Tables: `User`, `Folder`, `Task`, and `FolderKind`. After changes: `pnpm db:migrate` then `pnpm db:generate`.     |
| `migrations/`   | SQL history applied to Postgres. Do not edit old migrations by hand unless fixing a broken deploy.               |

---

## `src/`

| Path                 | Why you care                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`           | Boots Express, CORS, JSON, mounts `/health`, `/me`, `/folders`, `/tasks`.                                                                    |
| `routes/goals.ts`    | HTTP handlers for the Goals tree (me, folders, tasks).                                                                                       |
| `lib/prisma.ts`      | Shared Prisma client.                                                                                                                        |
| `lib/constants.ts`   | `MAX_FOLDER_DEPTH`, `MAX_FOLDER_CHILDREN`, folder colors, demo email.                                                                        |
| `lib/folders.ts`     | Tree rules: sibling caps, depth, category→goal promotion, clear-tasks.                                                                       |
| `lib/tasks.ts`       | Task create/list/toggle/delete; only on `kind = category` leaves.                                                                            |

### API ↔ Takeoff

Takeoff calls these from `apps/takeoff/src/lib/api.ts` with `NEXT_PUBLIC_API_URL` and header `X-User-Id` (from `GET /me`).

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/health` | API + DB ping |
| GET | `/me` | Upsert demo user; returns `{ id, email }` |
| GET | `/folders` | Flat folder list for `X-User-Id` |
| POST | `/folders` | Create top-level or child (`name`, optional `parentId`) |
| POST | `/folders/:id/clear-tasks` | Delete all tasks on a leaf |
| GET | `/folders/:id/tasks` | List tasks |
| POST | `/folders/:id/tasks` | Create task (`title`) |
| PATCH | `/tasks/:id` | Set `completed` |
| DELETE | `/tasks/:id` | Delete task |

---

## Files at this level you might still open

| File               | Why you care                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `prisma.config.ts` | Points Prisma at `schema.prisma` and `DATABASE_URL`. You rarely change this.                   |
| `.env`             | `DATABASE_URL`, `PORT`, and `CORS_ORIGIN` for local development.                               |
| `package.json`     | Scripts for running the server and Prisma. Prefer the root `pnpm` commands in the main README. |
