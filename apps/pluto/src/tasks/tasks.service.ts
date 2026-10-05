import { Inject, Injectable } from "@nestjs/common";
import { DomainError } from "../common/domain.error.js";
import { FoldersService } from "../folders/folders.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class TasksService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FoldersService) private readonly folders: FoldersService,
  ) {}

  normalizeTaskTitle(raw: unknown): string {
    if (typeof raw !== "string") {
      throw new DomainError(400, "Task title is required.");
    }
    const title = raw.trim();
    if (!title) {
      throw new DomainError(400, "Task title is required.");
    }
    if (title.length > 240) {
      throw new DomainError(400, "Task title must be 240 characters or fewer.");
    }
    return title;
  }

  async listTasksForFolder(userId: string, folderId: string) {
    await this.folders.getOwnedFolder(userId, folderId);
    return this.prisma.task.findMany({
      where: { userId, folderId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async createTask(userId: string, folderId: string, rawTitle: unknown) {
    const title = this.normalizeTaskTitle(rawTitle);
    const folder = await this.folders.getOwnedFolder(userId, folderId);

    if (folder.kind !== "category") {
      throw new DomainError(
        400,
        "Tasks can only be added to leaf folders. This folder already has goal subfolders.",
      );
    }

    const sortOrder = await this.prisma.task.count({
      where: { folderId: folder.id },
    });

    return this.prisma.task.create({
      data: {
        userId,
        folderId: folder.id,
        title,
        sortOrder,
      },
    });
  }

  async setTaskCompleted(userId: string, taskId: string, completed: boolean) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) {
      throw new DomainError(404, "Task not found.");
    }

    return this.prisma.task.update({
      where: { id: task.id },
      data: { completed },
    });
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) {
      throw new DomainError(404, "Task not found.");
    }

    await this.prisma.task.delete({ where: { id: task.id } });
    return { ok: true as const };
  }
}
