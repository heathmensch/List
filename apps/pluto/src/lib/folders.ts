// Folder business rules used by HTTP routes.
// Keep tree invariants here so route handlers stay thin: load row → call helper → respond.
import { prisma } from "./prisma.js";
import {
  FOLDER_COLORS,
  MAX_FOLDER_CHILDREN,
  MAX_FOLDER_DEPTH,
} from "./constants.js";
import type { Folder, FolderKind } from "../generated/prisma/client.js";

/** API/JSON error the route layer turns into HTTP status + message for toasts. */
export class FolderError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "FolderError";
  }
}

/** Trim and reject empty names before insert/update. */
export function normalizeFolderName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new FolderError(400, "Folder name is required.");
  }
  const name = raw.trim();
  if (!name) {
    throw new FolderError(400, "Folder name is required.");
  }
  if (name.length > 120) {
    throw new FolderError(400, "Folder name must be 120 characters or fewer.");
  }
  return name;
}

/** Load a folder owned by userId or throw 404. */
export async function getOwnedFolder(userId: string, folderId: string): Promise<Folder> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) {
    throw new FolderError(404, "Folder not found.");
  }
  return folder;
}

/**
 * Count siblings under the same parent for this user.
 * parentId null = top-level roots.
 */
export async function countSiblings(
  userId: string,
  parentId: string | null,
): Promise<number> {
  return prisma.folder.count({
    where: { userId, parentId },
  });
}

/** Pick the next palette color based on how many siblings already exist. */
export function colorForSiblingIndex(index: number): string {
  return FOLDER_COLORS[index % FOLDER_COLORS.length]!;
}

/**
 * Create a top-level folder (depth 1, kind category).
 * Enforces the max-10 top-level rule.
 */
export async function createTopLevelFolder(userId: string, rawName: unknown) {
  const name = normalizeFolderName(rawName);
  const siblingCount = await countSiblings(userId, null);
  if (siblingCount >= MAX_FOLDER_CHILDREN) {
    throw new FolderError(
      400,
      `You can have at most ${MAX_FOLDER_CHILDREN} top-level folders.`,
    );
  }

  return prisma.folder.create({
    data: {
      userId,
      parentId: null,
      name,
      kind: "category",
      color: colorForSiblingIndex(siblingCount),
      depth: 1,
      sortOrder: siblingCount,
    },
  });
}

/**
 * Add a child folder under parent.
 *
 * Rules:
 * - Parent depth must be < MAX_FOLDER_DEPTH (child would be parent.depth + 1).
 * - Parent may have at most MAX_FOLDER_CHILDREN children.
 * - If parent is category (leaf): it must have zero tasks; then promote parent
 *   to kind = goal and create child as category.
 * - If parent is already goal: just create another category child.
 */
export async function addChildFolder(
  userId: string,
  parentId: string,
  rawName: unknown,
) {
  const name = normalizeFolderName(rawName);
  const parent = await getOwnedFolder(userId, parentId);

  if (parent.depth >= MAX_FOLDER_DEPTH) {
    throw new FolderError(
      400,
      `Folders at depth ${MAX_FOLDER_DEPTH} cannot have subfolders.`,
    );
  }

  const childDepth = parent.depth + 1;
  const siblingCount = await countSiblings(userId, parent.id);
  if (siblingCount >= MAX_FOLDER_CHILDREN) {
    throw new FolderError(
      400,
      `You can have at most ${MAX_FOLDER_CHILDREN} folders at this level.`,
    );
  }

  // Leaf with tasks cannot grow a new goal layer until tasks are cleared.
  if (parent.kind === "category") {
    const taskCount = await prisma.task.count({ where: { folderId: parent.id } });
    if (taskCount > 0) {
      throw new FolderError(
        400,
        "Delete the tasks in this folder before adding another goal layer.",
      );
    }
  }

  // Transaction: promote parent if needed, then insert child leaf.
  return prisma.$transaction(async (tx) => {
    if (parent.kind === "category") {
      await tx.folder.update({
        where: { id: parent.id },
        data: { kind: "goal" satisfies FolderKind },
      });
    }

    return tx.folder.create({
      data: {
        userId,
        parentId: parent.id,
        name,
        kind: "category",
        color: colorForSiblingIndex(siblingCount),
        depth: childDepth,
        sortOrder: siblingCount,
      },
    });
  });
}

/**
 * Delete every task on a leaf folder so the user can add a goal layer next.
 * Does not create the child — the UI calls addChildFolder afterward (or shows the name prompt).
 */
export async function clearTasksOnFolder(userId: string, folderId: string) {
  const folder = await getOwnedFolder(userId, folderId);
  if (folder.kind !== "category") {
    throw new FolderError(400, "Only leaf folders hold tasks.");
  }

  const result = await prisma.task.deleteMany({
    where: { folderId: folder.id, userId },
  });

  return { deleted: result.count };
}

/**
 * Delete a leaf folder (no child folders).
 *
 * Rules:
 * - Reject if the folder has any children (recursive delete is out of scope).
 * - Tasks on this folder cascade-delete via Prisma (Task.folder onDelete: Cascade).
 * - If this was the last child of a parent goal, demote that parent back to category
 *   so it can hold tasks again.
 */
export async function deleteLeafFolder(userId: string, folderId: string) {
  const folder = await getOwnedFolder(userId, folderId);

  const childCount = await prisma.folder.count({
    where: { userId, parentId: folder.id },
  });
  if (childCount > 0) {
    throw new FolderError(
      400,
      "Remove all subfolders before deleting this folder.",
    );
  }

  // Also reject kind=goal with zero children if that ever appears (inconsistent state).
  if (folder.kind === "goal") {
    throw new FolderError(
      400,
      "Remove all subfolders before deleting this folder.",
    );
  }

  const parentId = folder.parentId;

  await prisma.$transaction(async (tx) => {
    await tx.folder.delete({ where: { id: folder.id } });

    // Last child removed → parent is a leaf again (category).
    if (parentId) {
      const remaining = await tx.folder.count({
        where: { userId, parentId },
      });
      if (remaining === 0) {
        await tx.folder.update({
          where: { id: parentId },
          data: { kind: "category" satisfies FolderKind },
        });
      }
    }
  });

  return { ok: true as const };
}

/** Flat list of one user's folders (UI builds the tree client-side). */
export async function listFoldersForUser(userId: string) {
  return prisma.folder.findMany({
    where: { userId },
    orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
