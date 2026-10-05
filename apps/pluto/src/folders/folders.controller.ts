import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { UserId } from "../common/user-id.decorator.js";
import { UserIdGuard } from "../common/user-id.guard.js";
import { FoldersService } from "./folders.service.js";

@Controller("folders")
@UseGuards(UserIdGuard)
export class FoldersController {
  constructor(@Inject(FoldersService) private readonly folders: FoldersService) {}

  /** GET /folders — flat list; Takeoff builds the tree client-side. */
  @Get()
  async list(@UserId() userId: string) {
    const folders = await this.folders.listFoldersForUser(userId);
    return { folders };
  }

  /**
   * POST /folders
   * Body: { name, parentId? } — top-level or child (may promote parent).
   */
  @Post()
  async create(
    @UserId() userId: string,
    @Body() body: { name?: unknown; parentId?: unknown },
    @Res({ passthrough: true }) res: Response,
  ) {
    const parentId =
      typeof body?.parentId === "string" && body.parentId.length > 0
        ? body.parentId
        : null;

    const folder = parentId
      ? await this.folders.addChildFolder(userId, parentId, body?.name)
      : await this.folders.createTopLevelFolder(userId, body?.name);

    res.status(201);
    return { folder };
  }

  /** POST /folders/:folderId/clear-tasks */
  @Post(":folderId/clear-tasks")
  async clearTasks(
    @UserId() userId: string,
    @Param("folderId") folderId: string,
  ) {
    return this.folders.clearTasksOnFolder(userId, folderId);
  }

  /** DELETE /folders/:folderId — leaf only; tasks cascade. */
  @Delete(":folderId")
  async remove(
    @UserId() userId: string,
    @Param("folderId") folderId: string,
  ) {
    return this.folders.deleteLeafFolder(userId, folderId);
  }
}
