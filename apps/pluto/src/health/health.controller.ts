import { Controller, Get, Inject, Res } from "@nestjs/common";
import type { Response } from "express";
import { HealthService } from "./health.service.js";

@Controller()
export class HealthController {
  // Explicit @Inject — required when running via tsx (no emitDecoratorMetadata).
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  /**
   * GET /health
   * 200 when API + DB are up; 503 when Postgres is down (Takeoff status pills).
   */
  @Get("health")
  async healthCheck(@Res() res: Response) {
    try {
      const body = await this.health.check();
      return res.status(200).json(body);
    } catch (error) {
      console.error("Health check failed:", error);
      return res.status(503).json({
        status: "error",
        service: "api",
        database: "disconnected",
      });
    }
  }
}
