// Pluto NestJS entry point.
//
// Route map (unchanged from Express so Takeoff keeps working):
//   GET  /health
//   GET  /me
//   GET  /folders
//   POST /folders
//   POST /folders/:id/clear-tasks
//   DELETE /folders/:id
//   GET  /folders/:id/tasks
//   POST /folders/:id/tasks
//   PATCH /tasks/:id
//   DELETE /tasks/:id
//   GET  /today/plan
//   GET  /today/blocks?from&to
//   POST /today/blocks
//   DELETE /today/blocks/:id
//

import "reflect-metadata";
if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DomainExceptionFilter } from "./common/domain-exception.filter.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Comma-separated exact origins (Takeoff prod + any preview URLs you need).
  const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    allowedHeaders: ["Content-Type", "X-User-Id"],
  });

  // Same { error: string } JSON shape Takeoff toasts rely on.
  app.useGlobalFilters(new DomainExceptionFilter());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
