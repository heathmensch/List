// Pluto's entry point. Node loads this file, Express builds a request pipeline,
// then app.listen() binds a TCP server. Each HTTP request runs through the
// app.use() middleware in order, then the matching route handler.
//
// Route map (Goals feature):
//   GET  /health
//   GET  /me                          → demo user { id, email }
//   GET  /folders                     → flat folder list (X-User-Id)
//   POST /folders                     → create top-level or child folder
//   POST /folders/:id/clear-tasks     → wipe tasks on a leaf
//   GET  /folders/:id/tasks           → list tasks
//   POST /folders/:id/tasks           → create task
//   PATCH /tasks/:id                  → toggle completed
//   DELETE /tasks/:id                 → delete task
//
// Takeoff (Next.js) calls these from apps/takeoff/src/lib/api.ts using
// NEXT_PUBLIC_API_URL (default http://localhost:4000).
import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";
import {
  folderTasksRouter,
  foldersRouter,
  meRouter,
  tasksRouter,
} from "./routes/goals.js";

const app = express();
// Port Pluto listens on. Comes from apps/pluto/.env, or 4000 if unset.
const port = Number(process.env.PORT ?? 4000);
// Browser origin allowed to call this API. Locally that is Takeoff (localhost:3000).
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

// CORS middleware adds Access-Control-Allow-Origin so a browser on Takeoff's
// origin can call this API. Server-to-server fetches (Next.js SSR) skip this.
// Expose nothing special; the browser sends X-User-Id as a request header.
app.use(
  cors({
    origin: corsOrigin,
    allowedHeaders: ["Content-Type", "X-User-Id"],
  }),
);
// Body parser: if the request has Content-Type: application/json, put the
// parsed object on req.body for later route handlers.
app.use(express.json());

// GET /health: run a trivial SQL round-trip. SELECT 1 does not read a table;
// it only proves the Postgres connection works. 200 = both up, 503 = DB down.
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      service: "api",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      service: "api",
      database: "disconnected",
    });
  }
});

// Goals / auth-bootstrap routes — see src/routes/goals.ts for handlers.
app.use("/me", meRouter);
app.use("/folders", foldersRouter);
app.use("/folders/:folderId/tasks", folderTasksRouter);
app.use("/tasks", tasksRouter);

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

// Stop accepting new connections, then close the Postgres pool so the process
// can exit cleanly. SIGINT is Ctrl+C; SIGTERM is what Docker/hosts send.
async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
