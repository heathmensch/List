"use client";

// Today page workspace: Plan Your Day (leaf goals/tasks) + day calendar.
//
// Flow:
//   1. getMe → getTodayPlan + listTimeBlocks(local day bounds)
//   2. User drags a range on the calendar → pick mode (dim UI, keep left panel live)
//      Overlapping an existing block → toast and cancel (no pick mode)
//   3. Click a task → POST /today/blocks → refresh blocks, exit pick mode
//   4. Click outside the plan panel → cancel draft
//   5. Empty leaf goal during pick → toast
//   6. Right-click a calendar block → Delete (DELETE /today/blocks/:id)

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  createTimeBlock,
  deleteTimeBlock,
  getMe,
  getTodayPlan,
  listTimeBlocks,
  type PlanGoal,
  type TimeBlock,
} from "@/lib/api";
import { formatClock, localDayBounds, rangesOverlap } from "@/lib/dayTime";
import { ToastProvider, useToast } from "@/components/Toast";
import { PlanPanel } from "@/components/today/PlanPanel";
import {
  DayCalendar,
  type DraftRange,
} from "@/components/today/DayCalendar";
import { FolderContextMenu } from "@/components/goals/FolderContextMenu";

type BlockMenuState = {
  blockId: string;
  x: number;
  y: number;
};

function TodayWorkspaceInner() {
  const { showToast } = useToast();
  // Freeze "today" for this page session so the heading doesn't flip at midnight mid-session.
  const [day] = useState(() => new Date());
  const panelRef = useRef<HTMLElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<PlanGoal[]>([]);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftRange | null>(null);
  const [picking, setPicking] = useState(false);
  const [blockMenu, setBlockMenu] = useState<BlockMenuState | null>(null);

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

  const refreshBlocks = useCallback(
    async (uid: string) => {
      const { from, to } = localDayBounds(day);
      const { blocks: next } = await listTimeBlocks(uid, from, to);
      setBlocks(next);
    },
    [day],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUserId(me.id);
        const [{ goals: nextGoals }] = await Promise.all([
          getTodayPlan(me.id),
          refreshBlocks(me.id),
        ]);
        if (cancelled) return;
        setGoals(nextGoals);
        // Open goals that already have tasks so the list feels useful on first load.
        setExpandedIds(
          new Set(nextGoals.filter((g) => g.tasks.length > 0).map((g) => g.id)),
        );
      } catch (error) {
        if (!cancelled) reportError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshBlocks, reportError]);

  function toggleGoal(goalId: string) {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(goalId)) copy.delete(goalId);
      else copy.add(goalId);
      return copy;
    });
  }

  function cancelPick() {
    setPicking(false);
    setDraft(null);
  }

  function commitDraft(range: DraftRange) {
    const overlaps = blocks.some((block) =>
      rangesOverlap(
        range.startAt,
        range.endAt,
        new Date(block.startAt),
        new Date(block.endAt),
      ),
    );
    if (overlaps) {
      setDraft(null);
      showToast("You can't slide over existing tasks", "error");
      return;
    }
    setDraft(range);
    setPicking(true);
  }

  async function handlePickTask(taskId: string) {
    if (!userId || !draft) return;
    try {
      const { block } = await createTimeBlock(userId, {
        taskId,
        startAt: draft.startAt,
        endAt: draft.endAt,
      });
      setBlocks((prev) =>
        [...prev, block].sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        ),
      );
      cancelPick();
      showToast("Scheduled on your day.", "success");
    } catch (error) {
      reportError(error);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!userId) return;
    try {
      await deleteTimeBlock(userId, blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      setBlockMenu(null);
      showToast("Removed from your day.", "success");
    } catch (error) {
      reportError(error);
    }
  }

  // Outside click while picking cancels the draft (clicks inside the plan panel are ignored).
  useEffect(() => {
    if (!picking) return;

    function onPointerDown(event: PointerEvent) {
      const panel = panelRef.current;
      const target = event.target as Node | null;
      if (panel && target && panel.contains(target)) return;
      cancelPick();
    }

    // Bubble phase so plan-panel buttons still receive the click first.
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [picking]);

  const pickRangeLabel = draft
    ? `${formatClock(draft.startAt)} – ${formatClock(draft.endAt)}`
    : null;

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted)]">Loading your day…</p>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          My Daily Plan
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Block time for the tasks that move your goals forward.
        </p>
      </header>

      <div className="relative flex min-h-[36rem] flex-1 gap-6">
        {/* Dim overlay in pick mode — plan panel stays above (z-30). */}
        {picking && (
          <div
            className="absolute inset-0 z-20 rounded-xl bg-black/35"
            aria-hidden
          />
        )}

        <PlanPanel
          goals={goals}
          expandedIds={expandedIds}
          onToggleGoal={toggleGoal}
          picking={picking}
          pickRangeLabel={pickRangeLabel}
          onPickTask={(taskId) => {
            void handlePickTask(taskId);
          }}
          onPickEmptyGoal={() => {
            showToast(
              "Add tasks to this goal in order to select from it",
              "error",
            );
          }}
          panelRef={panelRef}
        />

        <div className={`relative min-w-0 flex-1 ${picking ? "z-10" : ""}`}>
          <DayCalendar
            day={day}
            blocks={blocks}
            draft={draft}
            picking={picking}
            onDraftCommit={commitDraft}
            onDraftPreview={(range) => {
              if (!picking) setDraft(range);
            }}
            onBlockContextMenu={(blockId, x, y) => {
              setBlockMenu({ blockId, x, y });
            }}
          />
        </div>
      </div>

      {blockMenu && (
        <FolderContextMenu
          x={blockMenu.x}
          y={blockMenu.y}
          items={[
            {
              id: "delete",
              label: "Delete",
              danger: true,
              onSelect: () => {
                void handleDeleteBlock(blockMenu.blockId);
              },
            },
          ]}
          onClose={() => setBlockMenu(null)}
        />
      )}
    </div>
  );
}

export function TodayWorkspace() {
  return (
    <ToastProvider>
      <TodayWorkspaceInner />
    </ToastProvider>
  );
}
