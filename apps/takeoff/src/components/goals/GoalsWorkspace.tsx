"use client";

// Goals page workspace: loads the demo user + folder tree from Pluto, then
// renders the screenshot-style two-column Goals UI (tree + detail).
//
// Data flow:
//   1. getMe()              → user id
//   2. listFolders(userId)  → flat folders → buildFolderTree()
//   3. listTasks(userId, selectedFolderId) when selection changes
//
// Right-click rules (product):
//   - Leaf (category) with no tasks, depth < 10:
//       "Add another goal folder" | "Add tasks"
//   - Leaf with tasks:
//       "Clear tasks and add another level of goals" (+ task editing in panel)
//   - Goal (has children), depth < 10:
//       "Add another goal folder"
//   - Depth 10 leaf: tasks only (cannot add goal layer)

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  clearFolderTasks,
  createFolder,
  createTask,
  deleteTask,
  getMe,
  listFolders,
  listTasks,
  setTaskCompleted,
  type Folder,
  type Task,
} from "@/lib/api";
import { buildFolderTree, folderBreadcrumbs } from "@/lib/folderTree";
import { ToastProvider, useToast } from "@/components/Toast";
import { FolderTree } from "@/components/goals/FolderTree";
import {
  FolderContextMenu,
  type ContextMenuState,
} from "@/components/goals/FolderContextMenu";
import { FolderDetail } from "@/components/goals/FolderDetail";
import { NamePrompt } from "@/components/goals/NamePrompt";

const MAX_DEPTH = 10;

type NamePromptState =
  | { mode: "top-level" }
  | { mode: "child"; parentId: string };

function GoalsWorkspaceInner() {
  const { showToast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [prompt, setPrompt] = useState<NamePromptState | null>(null);

  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const selected = folders.find((f) => f.id === selectedId) ?? null;
  const breadcrumbs = selected
    ? folderBreadcrumbs(folders, selected.id)
    : [];

  /** Show Pluto/API errors as toasts. */
  const reportError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        showToast(error.message, "error");
        return;
      }
      showToast("Something went wrong. Please try again.", "error");
    },
    [showToast],
  );

  const refreshFolders = useCallback(
    async (uid: string, preferSelectId?: string | null) => {
      const { folders: next } = await listFolders(uid);
      setFolders(next);
      setSelectedId((current) => {
        if (preferSelectId && next.some((f) => f.id === preferSelectId)) {
          return preferSelectId;
        }
        if (current && next.some((f) => f.id === current)) return current;
        return next[0]?.id ?? null;
      });
      // Expand ancestors so new children are visible.
      setExpandedIds((prev) => {
        const copy = new Set(prev);
        for (const folder of next) {
          if (folder.kind === "goal") copy.add(folder.id);
        }
        return copy;
      });
    },
    [],
  );

  // Boot: demo user, then folders.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUserId(me.id);
        await refreshFolders(me.id);
      } catch (error) {
        if (!cancelled) reportError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshFolders, reportError]);

  // Load tasks whenever the selected folder changes.
  useEffect(() => {
    if (!userId || !selectedId) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { tasks: next } = await listTasks(userId, selectedId);
        if (!cancelled) setTasks(next);
      } catch (error) {
        if (!cancelled) reportError(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, selectedId, reportError]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  async function handleCreateNamed(name: string) {
    if (!userId || !prompt) return;
    try {
      if (prompt.mode === "top-level") {
        const { folder } = await createFolder(userId, { name });
        await refreshFolders(userId, folder.id);
      } else {
        const { folder } = await createFolder(userId, {
          name,
          parentId: prompt.parentId,
        });
        setExpandedIds((prev) => new Set(prev).add(prompt.parentId));
        await refreshFolders(userId, folder.id);
      }
      setPrompt(null);
    } catch (error) {
      reportError(error);
    }
  }

  async function handleClearTasksAndAddGoal(folderId: string) {
    if (!userId) return;
    try {
      await clearFolderTasks(userId, folderId);
      setTasks([]);
      showToast("Tasks cleared. Name the next goal folder.", "success");
      setPrompt({ mode: "child", parentId: folderId });
    } catch (error) {
      reportError(error);
    }
  }

  /** Build right-click actions for the folder under the cursor. */
  function menuItemsFor(folder: Folder, taskCount: number) {
    const items: {
      id: string;
      label: string;
      danger?: boolean;
      onSelect: () => void;
    }[] = [];

    if (folder.kind === "category") {
      if (folder.depth < MAX_DEPTH) {
        if (taskCount === 0) {
          items.push({
            id: "add-goal",
            label: "Add another goal folder",
            onSelect: () => setPrompt({ mode: "child", parentId: folder.id }),
          });
          items.push({
            id: "add-tasks",
            label: "Add tasks",
            onSelect: () => {
              setSelectedId(folder.id);
            },
          });
        } else {
          items.push({
            id: "clear-and-add",
            label: "Clear tasks and add another level of goals",
            danger: true,
            onSelect: () => {
              void handleClearTasksAndAddGoal(folder.id);
            },
          });
          // Same action the API would reject — toast immediately for clarity.
          items.push({
            id: "add-goal-blocked",
            label: "Add another goal folder",
            onSelect: () => {
              showToast(
                "Delete the tasks in this folder before adding another goal layer.",
                "error",
              );
            },
          });
        }
      } else {
        // Depth cap: leaf may still hold tasks, but cannot nest further.
        items.push({
          id: "add-tasks",
          label: "Add tasks",
          onSelect: () => {
            setSelectedId(folder.id);
          },
        });
      }
    } else if (folder.kind === "goal" && folder.depth < MAX_DEPTH) {
      items.push({
        id: "add-goal",
        label: "Add another goal folder",
        onSelect: () => setPrompt({ mode: "child", parentId: folder.id }),
      });
    }

    return items;
  }

  /**
   * Select the folder, load its tasks so the menu knows the leaf state, then open.
   */
  async function openContextMenu(folderId: string, x: number, y: number) {
    setSelectedId(folderId);
    let taskCount = 0;
    if (userId) {
      try {
        const { tasks: next } = await listTasks(userId, folderId);
        setTasks(next);
        taskCount = next.length;
      } catch (error) {
        reportError(error);
        return;
      }
    }
    setMenu({ folderId, x, y, taskCount });
  }

  const menuFolder = menu
    ? folders.find((f) => f.id === menu.folderId) ?? null
    : null;

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted)]">Loading your goals…</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Page header — matches screenshot: title, subtitle, Add Goal. */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            My Goals
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Big goals. Small steps. Real progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPrompt({ mode: "top-level" })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          <span aria-hidden>+</span> Add Goal
        </button>
      </div>

      {/* Tree (left) + detail (right). */}
      <div className="mt-8 flex min-h-[28rem] flex-1 gap-8">
        <div className="w-full max-w-sm shrink-0 overflow-auto rounded-xl border border-[var(--border)] bg-[#fafaf8] p-3">
          {tree.length === 0 ? (
            <p className="px-2 py-6 text-sm text-[var(--muted)]">
              No folders yet. Click <strong>+ Add Goal</strong> to create your
              first top-level folder.
            </p>
          ) : (
            <FolderTree
              nodes={tree}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={setSelectedId}
              onToggle={toggleExpanded}
              onContextMenu={(folderId, x, y) => {
                void openContextMenu(folderId, x, y);
              }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-auto rounded-xl border border-[var(--border)] bg-white p-6">
          {selected ? (
            <FolderDetail
              folder={selected}
              breadcrumbs={breadcrumbs}
              tasks={tasks}
              canAddTasks={selected.kind === "category"}
              onToggleTask={async (taskId, completed) => {
                if (!userId) return;
                try {
                  const { task } = await setTaskCompleted(
                    userId,
                    taskId,
                    completed,
                  );
                  setTasks((prev) =>
                    prev.map((t) => (t.id === task.id ? task : t)),
                  );
                } catch (error) {
                  reportError(error);
                }
              }}
              onAddTask={async (title) => {
                if (!userId) return;
                try {
                  const { task } = await createTask(userId, selected.id, title);
                  setTasks((prev) => [...prev, task]);
                } catch (error) {
                  reportError(error);
                }
              }}
              onDeleteTask={async (taskId) => {
                if (!userId) return;
                try {
                  await deleteTask(userId, taskId);
                  setTasks((prev) => prev.filter((t) => t.id !== taskId));
                } catch (error) {
                  reportError(error);
                }
              }}
            />
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Select a folder to see its details and tasks.
            </p>
          )}
        </div>
      </div>

      {menu && menuFolder && (
        <FolderContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItemsFor(menuFolder, menu.taskCount)}
          onClose={() => setMenu(null)}
        />
      )}

      {prompt && (
        <NamePrompt
          title={
            prompt.mode === "top-level"
              ? "Add a top-level goal"
              : "Add another goal folder"
          }
          confirmLabel="Create"
          onCancel={() => setPrompt(null)}
          onConfirm={handleCreateNamed}
        />
      )}
    </div>
  );
}

/** Public export: wraps the workspace in the toast provider. */
export function GoalsWorkspace() {
  return (
    <ToastProvider>
      <GoalsWorkspaceInner />
    </ToastProvider>
  );
}
