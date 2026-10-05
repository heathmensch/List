import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { DomainError } from "../common/domain.error.js";
import { UserId } from "../common/user-id.decorator.js";
import { UserIdGuard } from "../common/user-id.guard.js";
import { TodayService } from "./today.service.js";

@Controller("today")
@UseGuards(UserIdGuard)
export class TodayController {
  constructor(@Inject(TodayService) private readonly today: TodayService) {}

  /** GET /today/plan */
  @Get("plan")
  async plan(@UserId() userId: string) {
    const goals = await this.today.listTodayPlan(userId);
    return { goals };
  }

  /** GET /today/blocks?from=&to= */
  @Get("blocks")
  async blocks(
    @UserId() userId: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    if (!from || !to) {
      throw new DomainError(400, "Query params from and to (ISO) are required.");
    }
    const blocks = await this.today.listTimeBlocksInRange(userId, from, to);
    return { blocks };
  }

  /** POST /today/blocks */
  @Post("blocks")
  async createBlock(
    @UserId() userId: string,
    @Body() body: { taskId?: unknown; startAt?: unknown; endAt?: unknown },
    @Res({ passthrough: true }) res: Response,
  ) {
    const block = await this.today.createTimeBlock(userId, {
      taskId: body?.taskId,
      startAt: body?.startAt,
      endAt: body?.endAt,
    });
    res.status(201);
    return { block };
  }

  /** DELETE /today/blocks/:blockId */
  @Delete("blocks/:blockId")
  async deleteBlock(
    @UserId() userId: string,
    @Param("blockId") blockId: string,
  ) {
    return this.today.deleteTimeBlock(userId, blockId);
  }
}
