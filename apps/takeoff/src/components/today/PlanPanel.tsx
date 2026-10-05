"use client";

// Left "Plan Your Day" panel: leaf goals with expandable task lists.
// Elevated above the dim overlay while the calendar is in task-pick mode.

import type { RefObject } from "react";
import type { PlanGoal } from "@/lib/api";

type PlanPanelProps = {
  goals: PlanGoal[];
  expandedIds: Set<string>;
  onToggleGoal: (goalId: string) => void;
  /** When set, the panel is in "pick a task" mode after a calendar drag. */
  picking: boolean;
  pickRangeLabel: string | null;
  onPickTask: (taskId: string) => void;
  onPickEmptyGoal: () => void;
  /** Ref so the parent can detect clicks inside vs outside this panel. */
  panelRef: RefObject<HTMLElement | null>;
};

export function PlanPanel({
  goals,
  expandedIds,
  onToggleGoal,
  picking,
  pickRangeLabel,
  onPickTask,
  onPickEmptyGoal,
  panelRef,
}: PlanPanelProps) {
  return (
    <aside
      ref={panelRef}
      className={`relative z-30 flex w-full max-w-sm shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white ${
        picking ? "ring-2 ring-[var(--brand)] shadow-lg" : ""
      }`}
    >
      <div className="border-b border-[var(--border)] px-4 py-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Plan Your Day
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {picking && pickRangeLabel
            ? `Select a task for ${pickRangeLabel}.`
            : "Drag a time range on the calendar, then pick a task."}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {goals.length === 0 ? (
          <p className="px-2 py-6 text-sm text-[var(--muted)]">
            No leaf goals yet. Create a goal with tasks on the Goals page.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {goals.map((goal) => {
              const expanded = expandedIds.has(goal.id);
              return (
                <li key={goal.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-black/[0.03]"
                    onClick={() => {
                      if (picking && goal.tasks.length === 0) {
                        onPickEmptyGoal();
                        return;
                      }
                      // Expand if collapsed; if already open during pick, keep picker up.
                      if (!expanded) onToggleGoal(goal.id);
                      else if (!picking) onToggleGoal(goal.id);
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: goal.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                      {goal.name}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {goal.tasks.length}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {expanded ? "▾" : "▸"}
                    </span>
                  </button>

                  {expanded && goal.tasks.length > 0 && (
                    <ul className="mb-1 ml-4 flex flex-col gap-0.5 border-l border-[var(--border)] pl-2">
                      {goal.tasks.map((task) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/[0.03] ${
                              picking
                                ? "cursor-pointer ring-0 hover:bg-[var(--nav-active)]"
                                : ""
                            }`}
                            onClick={() => {
                              if (picking) onPickTask(task.id);
                            }}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                task.completed
                                  ? "border-[var(--brand)] bg-[var(--brand)]"
                                  : "border-[var(--border)]"
                              }`}
                              aria-hidden
                            />
                            <span
                              className={`min-w-0 flex-1 truncate ${
                                task.completed
                                  ? "text-[var(--muted)] line-through"
                                  : "text-[var(--foreground)]"
                              }`}
                            >
                              {task.title}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {expanded && goal.tasks.length === 0 && (
                    <p className="mb-1 ml-6 text-xs text-[var(--muted)]">
                      No tasks yet.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
