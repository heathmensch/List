// Folder tree business rules. Injected as FoldersService under Nest.
import { Injectable, Inject } from "@nestjs/common";
import type { Folder, FolderKind } from "../generated/prisma/client.js";
import {
  FOLDER_COLORS,
  MAX_FOLDER_CHILDREN,
  MAX_FOLDER_DEPTH,
} from "../constants.js";
import { DomainError } from "../common/domain.error.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class FoldersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  normalizeFolderName(raw: unknown): string {
    if (typeof raw !== "string") {
      throw new DomainError(400, "Folder name is required.");
    }
    const name = raw.trim();
    if (!name) {
      throw new DomainError(400, "Folder name is required.");
    }
    if (name.length > 120) {
      throw new DomainError(400, "Folder name must be 120 characters or fewer.");
    }
    return name;
  }

  async getOwnedFolder(userId: string, folderId: string): Promise<Folder> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) {
      throw new DomainError(404, "Folder not found.");
    }
    return folder;
  }

  async countSiblings(userId: string, parentId: string | null): Promise<number> {
    return this.prisma.folder.count({
      where: { userId, parentId },
    });
  }

  colorForSiblingIndex(index: number): string {
    return FOLDER_COLORS[index % FOLDER_COLORS.length]!;
  }

  async createTopLevelFolder(userId: string, rawName: unknown) {
    const name = this.normalizeFolderName(rawName);
    const siblingCount = await this.countSiblings(userId, null);
    if (siblingCount >= MAX_FOLDER_CHILDREN) {
      throw new DomainError(
        400,
        `You can have at most ${MAX_FOLDER_CHILDREN} top-level folders.`,
      );
    }

    return this.prisma.folder.create({
      data: {
        userId,
        parentId: null,
        name,
        kind: "category",
        color: this.colorForSiblingIndex(siblingCount),
        depth: 1,
        sortOrder: siblingCount,
      },
    });
  }

  async addChildFolder(userId: string, parentId: string, rawName: unknown) {
    const name = this.normalizeFolderName(rawName);
    const parent = await this.getOwnedFolder(userId, parentId);

    if (parent.depth >= MAX_FOLDER_DEPTH) {
      throw new DomainError(
        400,
        `Folders at depth ${MAX_FOLDER_DEPTH} cannot have subfolders.`,
      );
    }

    const childDepth = parent.depth + 1;
    const siblingCount = await this.countSiblings(userId, parent.id);
    if (siblingCount >= MAX_FOLDER_CHILDREN) {
      throw new DomainError(
        400,
        `You can have at most ${MAX_FOLDER_CHILDREN} folders at this level.`,
      );
    }

    if (parent.kind === "category") {
      const taskCount = await this.prisma.task.count({
        where: { folderId: parent.id },
      });
      if (taskCount > 0) {
        throw new DomainError(
          400,
          "Delete the tasks in this folder before adding another goal layer.",
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
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
          color: this.colorForSiblingIndex(siblingCount),
          depth: childDepth,
          sortOrder: siblingCount,
        },
      });
    });
  }

  async clearTasksOnFolder(userId: string, folderId: string) {
    const folder = await this.getOwnedFolder(userId, folderId);
    if (folder.kind !== "category") {
      throw new DomainError(400, "Only leaf folders hold tasks.");
    }

    const result = await this.prisma.task.deleteMany({
      where: { folderId: folder.id, userId },
    });

    return { deleted: result.count };
  }

  async deleteLeafFolder(userId: string, folderId: string) {
    const folder = await this.getOwnedFolder(userId, folderId);

    const childCount = await this.prisma.folder.count({
      where: { userId, parentId: folder.id },
    });
    if (childCount > 0) {
      throw new DomainError(
        400,
        "Remove all subfolders before deleting this folder.",
      );
    }

    if (folder.kind === "goal") {
      throw new DomainError(
        400,
        "Remove all subfolders before deleting this folder.",
      );
    }

    const parentId = folder.parentId;

    await this.prisma.$transaction(async (tx) => {
      await tx.folder.delete({ where: { id: folder.id } });

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

  async listFoldersForUser(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }
}
