import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.js";
import { HealthModule } from "./health/health.module.js";
import { MeModule } from "./me/me.module.js";
import { FoldersModule } from "./folders/folders.module.js";
import { TasksModule } from "./tasks/tasks.module.js";
import { TodayModule } from "./today/today.module.js";

/**
 * Root Nest module. Feature modules own their controllers/services.
 * HTTP paths stay identical to the old Express API so Takeoff needs no URL changes.
 */
@Module({
  imports: [
    PrismaModule,
    HealthModule,
    MeModule,
    FoldersModule,
    TasksModule,
    TodayModule,
  ],
})
export class AppModule {}
