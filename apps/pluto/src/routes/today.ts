// Express routes for the Today page (plan list + calendar time blocks).
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { FolderError } from "../lib/folders.js";
import {
  createTimeBlock,
  deleteTimeBlock,
  listTimeBlocksInRange,
  listTodayPlan,
} from "../lib/today.js";

function requireUserId(req: Request): string {
  const userId = req.header("x-user-id")?.trim();
  if (!userId) {
    throw new FolderError(401, "Missing X-User-Id header. Call GET /me first.");
  }
  return userId;
}

function handleError(error: unknown, res: Response) {
  if (error instanceof FolderError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
}

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncRoute): AsyncRoute {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      handleError(error, res);
    }
  };
}

export const todayRouter: Router = Router();

/**
 * GET /today/plan
 * Leaf goals + tasks for the left Plan Your Day panel.
 */
todayRouter.get(
  "/plan",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const goals = await listTodayPlan(userId);
    res.json({ goals });
  }),
);

/**
 * GET /today/blocks?from=<ISO>&to=<ISO>
 * Scheduled blocks whose startAt is in [from, to). Client sends local-day bounds.
 */
todayRouter.get(
  "/blocks",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const from = typeof req.query.from === "string" ? req.query.from : "";
    const to = typeof req.query.to === "string" ? req.query.to : "";
    if (!from || !to) {
      throw new FolderError(400, "Query params from and to (ISO) are required.");
    }
    const blocks = await listTimeBlocksInRange(userId, from, to);
    res.json({ blocks });
  }),
);

/**
 * POST /today/blocks
 * Body: { taskId, startAt, endAt } — place a task into a dragged time range.
 */
todayRouter.post(
  "/blocks",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const block = await createTimeBlock(userId, {
      taskId: req.body?.taskId,
      startAt: req.body?.startAt,
      endAt: req.body?.endAt,
    });
    res.status(201).json({ block });
  }),
);

/**
 * DELETE /today/blocks/:blockId
 * Removes a scheduled calendar block (does not delete the underlying task).
 */
todayRouter.delete(
  "/blocks/:blockId",
  asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const result = await deleteTimeBlock(userId, req.params.blockId as string);
    res.json(result);
  }),
);
