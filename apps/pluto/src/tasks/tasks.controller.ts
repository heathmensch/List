import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { DomainError } from "../common/domain.error.js";
import { UserId } from "../common/user-id.decorator.js";
import { UserIdGuard } from "../common/user-id.guard.js";
import { TasksService } from "./tasks.service.js";

/** Nested under /folders/:folderId/tasks */
@Controller("folders/:folderId/tasks")
@UseGuards(UserIdGuard)
export class FolderTasksController {
  constructor(@Inject(TasksService) private readonly tasks: TasksService) {}

  @Get()
  async list(
    @UserId() userId: string,
    @Param("folderId") folderId: string,
  ) {
    const tasks = await this.tasks.listTasksForFolder(userId, folderId);
    return { tasks };
  }

  @Post()
  async create(
    @UserId() userId: string,
    @Param("folderId") folderId: string,
    @Body() body: { title?: unknown },
    @Res({ passthrough: true }) res: Response,
  ) {
    const task = await this.tasks.createTask(userId, folderId, body?.title);
    res.status(201);
    return { task };
  }
}

/** Top-level /tasks/:taskId */
@Controller("tasks")
@UseGuards(UserIdGuard)
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasks: TasksService) {}

  @Patch(":taskId")
  async patchCompleted(
    @UserId() userId: string,
    @Param("taskId") taskId: string,
    @Body() body: { completed?: unknown },
  ) {
    if (typeof body?.completed !== "boolean") {
      throw new DomainError(400, "completed must be a boolean.");
    }
    const task = await this.tasks.setTaskCompleted(
      userId,
      taskId,
      body.completed,
    );
    return { task };
  }

  @Delete(":taskId")
  async remove(@UserId() userId: string, @Param("taskId") taskId: string) {
    return this.tasks.deleteTask(userId, taskId);
  }
}
