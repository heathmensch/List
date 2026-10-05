# Lists

Monorepo for a Next.js frontend, NestJS API, and PostgreSQL database.

```
apps/takeoff   Next.js app (http://localhost:3000)
apps/pluto     NestJS + Prisma API (http://localhost:4000)
docs/          What each app's folders and files are for
```

What each folder is for: [docs/](./docs/README.md).

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (for local PostgreSQL)

## Setup

```bash
pnpm install
pnpm db:up
```

Environment files are already in place for local development:

- `apps/pluto/.env`
- `apps/takeoff/.env.local`

Copy from the `.env.example` files if you need to recreate them.

## Develop

```bash
pnpm dev
```

That starts the API and the Next.js app together.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run Takeoff + Pluto |
| `pnpm dev:takeoff` | Next.js only |
| `pnpm dev:pluto` | Nest API only |
| `pnpm db:up` | Start PostgreSQL |
| `pnpm db:down` | Stop PostgreSQL |
| `pnpm db:migrate` | Create/apply Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |

The home Goals/Today UI talks to Pluto over HTTP (`NEXT_PUBLIC_API_URL`).

## Database

PostgreSQL runs in Docker (`postgres:16-alpine`) as `lists-db` on host port `5433` (so it can run alongside other local Postgres containers).

Connection string:

```
postgresql://postgres:postgres@localhost:5433/lists?schema=public
```

Add models in `apps/pluto/prisma/schema.prisma`, then run:

```bash
pnpm db:migrate
pnpm db:generate
```
