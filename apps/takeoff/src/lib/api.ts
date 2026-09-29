// Helpers for calling Pluto from Takeoff.
//
// Linkage map (frontend → backend):
//   getMe()                      → GET  /me
//   listFolders(userId)          → GET  /folders
//   createFolder(userId, ...)    → POST /folders
//   clearFolderTasks(userId, id) → POST /folders/:id/clear-tasks
//   listTasks(userId, folderId)  → GET  /folders/:id/tasks
//   createTask(userId, ...)      → POST /folders/:id/tasks
//   setTaskCompleted(...)        → PATCH /tasks/:id
//   deleteTask(...)              → DELETE /tasks/:id
//
// Browser calls use NEXT_PUBLIC_API_URL. Until email auth exists, the Goals UI
// stores the demo user id from getMe() and sends it as X-User-Id.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

  const response = await fetch(`${API_URL}${path}`, {
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
    const response = await fetch(`${API_URL}/health`, { cache: "no-store" });
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
