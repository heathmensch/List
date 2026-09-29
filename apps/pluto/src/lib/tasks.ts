// Task business rules. Tasks only attach to leaf folders (kind = category).
import { prisma } from "./prisma.js";
import { FolderError, getOwnedFolder } from "./folders.js";

/** Trim and reject empty task titles. */
export function normalizeTaskTitle(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new FolderError(400, "Task title is required.");
  }
  const title = raw.trim();
  if (!title) {
    throw new FolderError(400, "Task title is required.");
  }
  if (title.length > 240) {
    throw new FolderError(400, "Task title must be 240 characters or fewer.");
  }
  return title;
}

/** List tasks for a folder the user owns. */
export async function listTasksForFolder(userId: string, folderId: string) {
  await getOwnedFolder(userId, folderId);
  return prisma.task.findMany({
    where: { userId, folderId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Create a task on a leaf folder.
 * Rejects if the folder is kind = goal (has child folders).
 */
export async function createTask(
  userId: string,
  folderId: string,
  rawTitle: unknown,
) {
  const title = normalizeTaskTitle(rawTitle);
  const folder = await getOwnedFolder(userId, folderId);

  if (folder.kind !== "category") {
    throw new FolderError(
      400,
      "Tasks can only be added to leaf folders. This folder already has goal subfolders.",
    );
  }

  const sortOrder = await prisma.task.count({ where: { folderId: folder.id } });

  return prisma.task.create({
    data: {
      userId,
      folderId: folder.id,
      title,
      sortOrder,
    },
  });
}

/** Toggle or set completed on a task owned by the user. */
export async function setTaskCompleted(
  userId: string,
  taskId: string,
  completed: boolean,
) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    throw new FolderError(404, "Task not found.");
  }

  return prisma.task.update({
    where: { id: task.id },
    data: { completed },
  });
}

/** Delete one task owned by the user. */
export async function deleteTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    throw new FolderError(404, "Task not found.");
  }

  await prisma.task.delete({ where: { id: task.id } });
  return { ok: true as const };
}
