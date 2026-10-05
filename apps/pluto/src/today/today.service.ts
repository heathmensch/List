import { Inject, Injectable } from "@nestjs/common";
import { DomainError } from "../common/domain.error.js";
import { PrismaService } from "../prisma/prisma.service.js";

export type PlanGoal = {
  id: string;
  name: string;
  color: string;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    sortOrder: number;
  }[];
};

@Injectable()
export class TodayService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listTodayPlan(userId: string): Promise<PlanGoal[]> {
    const leaves = await this.prisma.folder.findMany({
      where: {
        userId,
        kind: "category",
        children: { none: {} },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        tasks: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            title: true,
            completed: true,
            sortOrder: true,
          },
        },
      },
    });

    return leaves.map((leaf) => ({
      id: leaf.id,
      name: leaf.name,
      color: leaf.color,
      tasks: leaf.tasks,
    }));
  }

  private rangeBounds(fromIso: string, toIso: string): { start: Date; end: Date } {
    const start = new Date(fromIso);
    const end = new Date(toIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new DomainError(400, "Invalid from/to timestamps.");
    }
    if (end.getTime() <= start.getTime()) {
      throw new DomainError(400, "to must be after from.");
    }
    return { start, end };
  }

  async listTimeBlocksInRange(userId: string, fromIso: string, toIso: string) {
    const { start, end } = this.rangeBounds(fromIso, toIso);

    return this.prisma.timeBlock.findMany({
      where: {
        userId,
        startAt: { gte: start, lt: end },
      },
      orderBy: { startAt: "asc" },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            completed: true,
            folderId: true,
            folder: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async createTimeBlock(
    userId: string,
    input: { taskId: unknown; startAt: unknown; endAt: unknown },
  ) {
    if (typeof input.taskId !== "string" || !input.taskId) {
      throw new DomainError(400, "taskId is required.");
    }
    if (typeof input.startAt !== "string" || typeof input.endAt !== "string") {
      throw new DomainError(400, "startAt and endAt must be ISO date strings.");
    }

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new DomainError(400, "Invalid startAt or endAt.");
    }
    if (endAt.getTime() <= startAt.getTime()) {
      throw new DomainError(400, "endAt must be after startAt.");
    }

    const minMs = 15 * 60 * 1000;
    if (endAt.getTime() - startAt.getTime() < minMs) {
      throw new DomainError(400, "Time block must be at least 15 minutes.");
    }

    const task = await this.prisma.task.findFirst({
      where: { id: input.taskId, userId },
    });
    if (!task) {
      throw new DomainError(404, "Task not found.");
    }

    const overlapping = await this.prisma.timeBlock.findFirst({
      where: {
        userId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (overlapping) {
      throw new DomainError(400, "You can't slide over existing tasks");
    }

    return this.prisma.timeBlock.create({
      data: {
        userId,
        taskId: task.id,
        startAt,
        endAt,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            completed: true,
            folderId: true,
            folder: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteTimeBlock(userId: string, blockId: string) {
    const block = await this.prisma.timeBlock.findFirst({
      where: { id: blockId, userId },
    });
    if (!block) {
      throw new DomainError(404, "Time block not found.");
    }

    await this.prisma.timeBlock.delete({ where: { id: block.id } });
    return { ok: true as const };
  }
}
