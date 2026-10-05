// Today-page business rules: leaf goals for the plan list, and calendar time blocks.
import { prisma } from "./prisma.js";
import { FolderError } from "./folders.js";

/** Shape returned for the left "Plan Your Day" panel. */
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

/**
 * Leaf folders (kind = category, no children) for the signed-in user, each with tasks.
 * Includes empty leaves so the UI can toast when the user tries to pick from them.
 */
export async function listTodayPlan(userId: string): Promise<PlanGoal[]> {
  const leaves = await prisma.folder.findMany({
    where: {
      userId,
      kind: "category",
      // Only true leaves — no child folders under this node.
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

/** Inclusive start / exclusive-or-inclusive end range from ISO strings. */
function rangeBounds(fromIso: string, toIso: string): { start: Date; end: Date } {
  const start = new Date(fromIso);
  const end = new Date(toIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new FolderError(400, "Invalid from/to timestamps.");
  }
  if (end.getTime() <= start.getTime()) {
    throw new FolderError(400, "to must be after from.");
  }
  return { start, end };
}

/**
 * Time blocks whose start falls in [from, to), with task + parent folder for color/title.
 * The client sends local-day bounds as ISO so timezone stays correct.
 */
export async function listTimeBlocksInRange(
  userId: string,
  fromIso: string,
  toIso: string,
) {
  const { start, end } = rangeBounds(fromIso, toIso);

  return prisma.timeBlock.findMany({
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

/**
 * Place a task into a time range on the calendar.
 * Rejects ranges that overlap any existing block for this user.
 */
export async function createTimeBlock(
  userId: string,
  input: { taskId: unknown; startAt: unknown; endAt: unknown },
) {
  if (typeof input.taskId !== "string" || !input.taskId) {
    throw new FolderError(400, "taskId is required.");
  }
  if (typeof input.startAt !== "string" || typeof input.endAt !== "string") {
    throw new FolderError(400, "startAt and endAt must be ISO date strings.");
  }

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new FolderError(400, "Invalid startAt or endAt.");
  }
  if (endAt.getTime() <= startAt.getTime()) {
    throw new FolderError(400, "endAt must be after startAt.");
  }

  // Minimum useful block: 15 minutes (matches UI snap).
  const minMs = 15 * 60 * 1000;
  if (endAt.getTime() - startAt.getTime() < minMs) {
    throw new FolderError(400, "Time block must be at least 15 minutes.");
  }

  const task = await prisma.task.findFirst({
    where: { id: input.taskId, userId },
    include: {
      folder: { select: { id: true, name: true, color: true, kind: true } },
    },
  });
  if (!task) {
    throw new FolderError(404, "Task not found.");
  }

  // Overlap: existing.start < new.end AND existing.end > new.start
  const overlapping = await prisma.timeBlock.findFirst({
    where: {
      userId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (overlapping) {
    throw new FolderError(400, "You can't slide over existing tasks");
  }

  const block = await prisma.timeBlock.create({
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

  return block;
}

/** Delete a scheduled calendar block owned by the user. */
export async function deleteTimeBlock(userId: string, blockId: string) {
  const block = await prisma.timeBlock.findFirst({
    where: { id: blockId, userId },
  });
  if (!block) {
    throw new FolderError(404, "Time block not found.");
  }

  await prisma.timeBlock.delete({ where: { id: block.id } });
  return { ok: true as const };
}
