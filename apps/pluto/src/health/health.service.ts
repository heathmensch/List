import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Trivial SELECT 1 — proves Postgres is reachable. */
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok" as const,
      service: "api",
      database: "connected" as const,
    };
  }
}
