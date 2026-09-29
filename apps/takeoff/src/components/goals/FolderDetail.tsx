"use client";

// Right-hand detail panel for the selected folder: breadcrumbs + tasks for leaves.

import { useState } from "react";
import type { Folder, Task } from "@/lib/api";

type FolderDetailProps = {
  folder: Folder;
  breadcrumbs: Folder[];
  tasks: Task[];
  /** True when this leaf may accept new tasks (kind category). */
  canAddTasks: boolean;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onAddTask: (title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
};

export function FolderDetail({
  folder,
  breadcrumbs,
  tasks,
  canAddTasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}: FolderDetailProps) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length === 0 ? 0 : completedCount / tasks.length;

  async function submitTask(event: React.FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || pending) return;
    setPending(true);
    try {
      await onAddTask(title);
      setDraft("");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {/* Breadcrumb trail like the screenshot (> Parent > Child >). */}
      <p className="text-xs text-[var(--muted)]">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.id}>
            {index > 0 && <span className="mx-1">›</span>}
            {crumb.name}
          </span>
        ))}
      </p>

      <div className="mt-3 flex items-start gap-3">
        <span
          className="mt-1 inline-block h-8 w-8 rounded-md"
          style={{ backgroundColor: folder.color }}
          aria-hidden
        />
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {folder.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {folder.kind === "goal"
              ? "This folder has goal subfolders. Add tasks on a leaf folder instead."
              : canAddTasks
                ? "Add everyday action steps here, or right-click to add another goal layer."
                : "Right-click this folder to add tasks or another goal layer."}
          </p>
        </div>
      </div>

      {folder.kind === "category" && (
        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Action Steps
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--muted)]">
                {completedCount} / {tasks.length} complete
              </span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-1">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-black/[0.02]"
              >
                <button
                  type="button"
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  onClick={() => onToggleTask(task.id, !task.completed)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    task.completed
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  {task.completed && (
                    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M6.2 11.4 3.4 8.6l1.2-1.2 1.6 1.6 4.2-4.2 1.2 1.2-5.4 5.4z"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`min-w-0 flex-1 text-sm ${
                    task.completed
                      ? "text-[var(--muted)] line-through"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {task.title}
                </span>
                <button
                  type="button"
                  className="text-xs text-[var(--muted)] opacity-0 group-hover:opacity-100"
                  onClick={() => onDeleteTask(task.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {canAddTasks && (
            <form onSubmit={submitTask} className="mt-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="+ Add a task"
                disabled={pending}
                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] hover:bg-black/[0.02] focus:border-[var(--border)] focus:bg-white"
              />
            </form>
          )}
        </div>
      )}
    </section>
  );
}
