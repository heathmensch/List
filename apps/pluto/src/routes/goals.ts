// Express routers for Users / Folders / Tasks.
// index.ts mounts these under /me, /folders, and /tasks.
//
// Auth note: until email sign-in exists, the client sends X-User-Id from GET /me
// (demo user). Every mutating route re-checks that the row belongs to that user.
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { DEMO_USER_EMAIL } from "../lib/constants.js";
import {
  FolderError,
  addChildFolder,
  clearTasksOnFolder,
  createTopLevelFolder,
  deleteLeafFolder,
  listFoldersForUser,
} from "../lib/folders.js";
import {
  createTask,
  deleteTask,
  listTasksForFolder,
  setTaskCompleted,
} from "../lib/tasks.js";

/** Read X-User-Id or fail with 401. */
function requireUserId(req: Request): string {
  const userId = req.header("x-user-id")?.trim();
  if (!userId) {
    throw new FolderError(401, "Missing X-User-Id header. Call GET /me first.");
  }
  return userId;
}

/** Map FolderError (and unexpected errors) to JSON for the frontend toast. */
function handleError(error: unknown, res: Response) {
  if (error instanceof FolderError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
}

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Wrap async handlers so thrown errors reach handleError instead of crashing. */
function asyncHandler(fn: AsyncRoute): AsyncRoute {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      handleError(error, res);
    }
  };
}

// ---------------------------------------------------------------------------
// /me — demo user bootstrap (replace with real session auth later)
// ---------------------------------------------------------------------------
export const meRouter: Router = Router();

/**
 * GET /me
 * Upserts the demo user and returns { id, email }.
 * Takeoff calls this once, then sends id as X-User-Id on folder/task requests.
 */
meRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const user = await prisma.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {},
      create: { email: DEMO_USER_EMAIL },
    });
    res.json({ id: user.id, email: user.email });
  }),
);

// ---------------------------------------------------------------------------
// /folders
// ---------------------------------------------------------------------------
export const foldersRouter: Router = Router();

/**
 * GET /folders
 * Returns a flat array of the user's folders. Takeoff nests them into a tree.
 */
foldersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const folders = await listFoldersForUser(userId);
    res.json({ folders });
  }),
);

/**
 * POST /folders
 * Body: { name: string, parentId?: string | null }
 * - No parentId → top-level category folder.
 * - With parentId → child category; may promote parent category → goal.
 */
foldersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const parentId =
      typeof req.body?.parentId === "string" && req.body.parentId.length > 0
        ? req.body.parentId
        : null;

    const folder = parentId
      ? await addChildFolder(userId, parentId, req.body?.name)
      : await createTopLevelFolder(userId, req.body?.name);

    res.status(201).json({ folder });
  }),
);

/**
 * POST /folders/:folderId/clear-tasks
 * Deletes all tasks on a leaf so the UI can prompt for a new goal subfolder.
 */
foldersRouter.post(
  "/:folderId/clear-tasks",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const result = await clearTasksOnFolder(userId, req.params.folderId as string);
    res.json(result);
  }),
);

/**
 * DELETE /folders/:folderId
 * Deletes a leaf folder (no children). Attached tasks cascade away in Postgres.
 * If this was the parent's last child, the parent is demoted to category.
 */
foldersRouter.delete(
  "/:folderId",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const result = await deleteLeafFolder(userId, req.params.folderId as string);
    res.json(result);
  }),
);

// ---------------------------------------------------------------------------
// /folders/:folderId/tasks  and  /tasks/:taskId
// ---------------------------------------------------------------------------
export const folderTasksRouter: Router = Router({ mergeParams: true });

/**
 * GET /folders/:folderId/tasks
 * Lists action steps for one folder.
 */
folderTasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const tasks = await listTasksForFolder(userId, req.params.folderId as string);
    res.json({ tasks });
  }),
);

/**
 * POST /folders/:folderId/tasks
 * Body: { title: string }
 * Creates a task on a leaf (category) folder.
 */
folderTasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const task = await createTask(
      userId,
      req.params.folderId as string,
      req.body?.title,
    );
    res.status(201).json({ task });
  }),
);

export const tasksRouter: Router = Router();

/**
 * PATCH /tasks/:taskId
 * Body: { completed: boolean }
 */
tasksRouter.patch(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    if (typeof req.body?.completed !== "boolean") {
      throw new FolderError(400, "completed must be a boolean.");
    }
    const task = await setTaskCompleted(
      userId,
      req.params.taskId as string,
      req.body.completed,
    );
    res.json({ task });
  }),
);

/**
 * DELETE /tasks/:taskId
 */
tasksRouter.delete(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const result = await deleteTask(userId, req.params.taskId as string);
    res.json(result);
  }),
);
