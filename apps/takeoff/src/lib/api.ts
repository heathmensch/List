// Helpers for calling Pluto from Takeoff.
//
// Linkage map (frontend → backend):
//   getMe()                      → GET  /me
//   listFolders(userId)          → GET  /folders
//   createFolder(userId, ...)    → POST /folders
//   clearFolderTasks(userId, id) → POST /folders/:id/clear-tasks
//   deleteFolder(userId, id)     → DELETE /folders/:id
//   listTasks(userId, folderId)  → GET  /folders/:id/tasks
//   createTask(userId, ...)      → POST /folders/:id/tasks
//   setTaskCompleted(...)        → PATCH /tasks/:id
//   deleteTask(...)              → DELETE /tasks/:id
//   getTodayPlan(userId)         → GET  /today/plan
//   listTimeBlocks(userId, ...)  → GET  /today/blocks?from&to
//   createTimeBlock(userId, ...) → POST /today/blocks
//   deleteTimeBlock(userId, id)  → DELETE /today/blocks/:id
//
// Until email auth exists, the Goals UI stores the demo user id from getMe()
// and sends it as X-User-Id.
//
// Which host this module calls:
//   - Server on Vercel: PLUTO_URL, injected by the takeoff → pluto binding.
//     Do not set PLUTO_URL. Bindings are runtime-only and are not available
//     in the browser, during `next build`, or in middleware.
//   - Local `pnpm dev`: NEXT_PUBLIC_API_URL (http://localhost:4000).
//   - Browser on Vercel: same-origin /api, rewritten to Pluto. The rewrite
//     strips that prefix, so Pluto still sees /folders, /tasks, and so on.

function resolveApiUrl(path: string): string {
  if (typeof window === "undefined" && process.env.PLUTO_URL) {
    return new URL(path.replace(/^\//, ""), process.env.PLUTO_URL).toString();
  }

  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) {
    return `${configured}${path}`;
  }

  if (typeof window !== "undefined") {
    return `/api${path}`;
  }

  return `http://localhost:4000${path}`;
}

// ---------------------------------------------------------------------------
// Shared types (mirror Pluto JSON; keep in sync with prisma FolderKind)
// ---------------------------------------------------------------------------

/** Leaf that may hold tasks, or parent that already has child folders. */
export type FolderKind = "category" | "goal";

export type Folder = {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  kind: FolderKind;
  color: string;
  depth: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  userId: string;
  folderId: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Me = {
  id: string;
  email: string;
};

/** Error body Pluto returns on 4xx/5xx — shown in the Goals toast. */
type ApiErrorBody = {
  error?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Low-level fetch
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    userId?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  // Pluto scopes every folder/task query to this user id.
  if (options.userId) {
    headers["X-User-Id"] = options.userId;
  }

  const response = await fetch(resolveApiUrl(path), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as ApiErrorBody;
      if (data.error) message = data.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Health (existing)
// ---------------------------------------------------------------------------

export type HealthResponse = {
  status: "ok" | "error";
  service: string;
  database: "connected" | "disconnected";
};

export type HealthResult =
  | { ok: true; data: HealthResponse }
  | { ok: false; reason: "unreachable" | "unhealthy" };

export async function getApiHealth(): Promise<HealthResult> {
  try {
    const response = await fetch(resolveApiUrl("/health"), { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, reason: "unhealthy" };
    }
    const data = (await response.json()) as HealthResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

// ---------------------------------------------------------------------------
// Me / Folders / Tasks — used by the Goals page client UI
// ---------------------------------------------------------------------------

/** Bootstrap demo user; returns the id to send as X-User-Id. */
export function getMe() {
  return apiFetch<Me>("/me");
}

export function listFolders(userId: string) {
  return apiFetch<{ folders: Folder[] }>("/folders", { userId });
}

/** Create a top-level folder or a child under parentId. */
export function createFolder(
  userId: string,
  input: { name: string; parentId?: string | null },
) {
  return apiFetch<{ folder: Folder }>("/folders", {
    method: "POST",
    userId,
    body: {
      name: input.name,
      parentId: input.parentId ?? null,
    },
  });
}

/** Wipe tasks on a leaf before adding another goal layer. */
export function clearFolderTasks(userId: string, folderId: string) {
  return apiFetch<{ deleted: number }>(`/folders/${folderId}/clear-tasks`, {
    method: "POST",
    userId,
  });
}

/**
 * Delete a leaf folder (no children). Tasks on it are removed by the DB cascade.
 * Pluto returns 400 if the folder still has subfolders.
 */
export function deleteFolder(userId: string, folderId: string) {
  return apiFetch<{ ok: true }>(`/folders/${folderId}`, {
    method: "DELETE",
    userId,
  });
}

export function listTasks(userId: string, folderId: string) {
  return apiFetch<{ tasks: Task[] }>(`/folders/${folderId}/tasks`, { userId });
}

export function createTask(userId: string, folderId: string, title: string) {
  return apiFetch<{ task: Task }>(`/folders/${folderId}/tasks`, {
    method: "POST",
    userId,
    body: { title },
  });
}

export function setTaskCompleted(
  userId: string,
  taskId: string,
  completed: boolean,
) {
  return apiFetch<{ task: Task }>(`/tasks/${taskId}`, {
    method: "PATCH",
    userId,
    body: { completed },
  });
}

export function deleteTask(userId: string, taskId: string) {
  return apiFetch<{ ok: true }>(`/tasks/${taskId}`, {
    method: "DELETE",
    userId,
  });
}

// ---------------------------------------------------------------------------
// Today — plan list + calendar time blocks
// ---------------------------------------------------------------------------

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

export type TimeBlock = {
  id: string;
  userId: string;
  taskId: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
  task: {
    id: string;
    title: string;
    completed: boolean;
    folderId: string;
    folder: {
      id: string;
      name: string;
      color: string;
    };
  };
};

/** Leaf goals + tasks for the Plan Your Day panel. */
export function getTodayPlan(userId: string) {
  return apiFetch<{ goals: PlanGoal[] }>("/today/plan", { userId });
}

/** Blocks whose startAt is in [from, to). Pass local-day bounds as ISO strings. */
export function listTimeBlocks(userId: string, from: Date, to: Date) {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return apiFetch<{ blocks: TimeBlock[] }>(`/today/blocks?${params}`, {
    userId,
  });
}

/** Schedule a task into a dragged calendar range. */
export function createTimeBlock(
  userId: string,
  input: { taskId: string; startAt: Date; endAt: Date },
) {
  return apiFetch<{ block: TimeBlock }>("/today/blocks", {
    method: "POST",
    userId,
    body: {
      taskId: input.taskId,
      startAt: input.startAt.toISOString(),
      endAt: input.endAt.toISOString(),
    },
  });
}

/** Remove a calendar block (the task itself stays on the goal). */
export function deleteTimeBlock(userId: string, blockId: string) {
  return apiFetch<{ ok: true }>(`/today/blocks/${blockId}`, {
    method: "DELETE",
    userId,
  });
}
