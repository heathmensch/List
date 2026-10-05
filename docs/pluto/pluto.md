# Pluto

Pluto is the backend. It is a **NestJS** API that talks to PostgreSQL through Prisma.

Most day-to-day work happens in two places: `prisma/` (the database shape) and `src/` (Nest modules).

```
apps/pluto
  prisma/             Database schema + migrations
  src/                NestJS app (modules, controllers, services)
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
| `schema.prisma` | Tables: `User`, `Folder`, `Task`, `TimeBlock`, `FolderKind`. After changes: `pnpm db:migrate` then `pnpm db:generate`. |
| `migrations/`   | SQL history applied to Postgres. Do not edit old migrations by hand unless fixing a broken deploy.               |

---

## `src/`

| Path | Why you care |
| ---- | ------------ |
| `main.ts` | Boots Nest, CORS, global `{ error }` filter, listens on `PORT`. |
| `app.module.ts` | Imports feature modules. |
| `prisma/` | `PrismaService` + global `PrismaModule`. |
| `common/` | `DomainError`, exception filter, `X-User-Id` guard/decorator. |
| `health/` | `GET /health` |
| `me/` | `GET /me` demo user bootstrap |
| `folders/` | Folder tree CRUD rules + `/folders` routes |
| `tasks/` | Task routes under `/folders/:id/tasks` and `/tasks/:id` |
| `today/` | Plan list + calendar time blocks |
| `constants.ts` | Depth/sibling caps, folder colors, demo email |

### API ↔ Takeoff

Takeoff calls these from `apps/takeoff/src/lib/api.ts` with `NEXT_PUBLIC_API_URL` and header `X-User-Id` (from `GET /me`). Paths are unchanged from the Express era.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/health` | API + DB ping |
| GET | `/me` | Upsert demo user; returns `{ id, email }` |
| GET | `/folders` | Flat folder list for `X-User-Id` |
| POST | `/folders` | Create top-level or child (`name`, optional `parentId`) |
| POST | `/folders/:id/clear-tasks` | Delete all tasks on a leaf |
| DELETE | `/folders/:id` | Delete leaf folder (no children); tasks cascade; may demote parent |
| GET | `/folders/:id/tasks` | List tasks |
| POST | `/folders/:id/tasks` | Create task (`title`) |
| PATCH | `/tasks/:id` | Set `completed` |
| DELETE | `/tasks/:id` | Delete task |
| GET | `/today/plan` | Leaf goals + tasks for Plan Your Day |
| GET | `/today/blocks?from&to` | Time blocks in an ISO range |
| POST | `/today/blocks` | Schedule a task; rejects overlaps |
| DELETE | `/today/blocks/:id` | Remove a calendar block |

---

## Files at this level you might still open

| File               | Why you care                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `prisma.config.ts` | Points Prisma at `schema.prisma` and `DATABASE_URL`. You rarely change this.                   |
| `.env`             | `DATABASE_URL`, `PORT`, and `CORS_ORIGIN` for local development.                               |
| `package.json`     | Scripts for running the server and Prisma. Prefer the root `pnpm` commands in the main README. |
