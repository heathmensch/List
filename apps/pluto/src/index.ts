// Pluto's entry point. Node loads this file, Express builds a request pipeline,
// then app.listen() binds a TCP server. Each HTTP request runs through the
// app.use() middleware in order, then the matching app.get()/app.post() handler.
import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";

const app = express();
// Port Pluto listens on. Comes from apps/pluto/.env, or 4000 if unset.
const port = Number(process.env.PORT ?? 4000);
// Browser origin allowed to call this API. Locally that is Takeoff (localhost:3000).
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

// CORS middleware adds Access-Control-Allow-Origin so a browser on Takeoff's
// origin can call this API. Server-to-server fetches (Next.js SSR) skip this.
app.use(
  cors({
    origin: corsOrigin,
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
