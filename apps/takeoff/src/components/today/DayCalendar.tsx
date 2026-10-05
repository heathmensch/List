"use client";

// Day calendar grid: drag to select a time range, then hand off to task-pick mode.
// Renders existing TimeBlocks with parent-goal color and task title.

import { useCallback, useRef, useState } from "react";
import type { TimeBlock } from "@/lib/api";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  formatClock,
  formatDuration,
  dateFromDayMinutes,
  gridHeightPx,
  hourLabels,
  minutesFromDayStart,
  minutesToY,
  softFill,
  yToMinutes,
} from "@/lib/dayTime";

export type DraftRange = {
  startAt: Date;
  endAt: Date;
};

type DayCalendarProps = {
  day: Date;
  blocks: TimeBlock[];
  /** Shown while dragging or while waiting for a task pick. */
  draft: DraftRange | null;
  picking: boolean;
  onDraftCommit: (range: DraftRange) => void;
  onDraftPreview: (range: DraftRange | null) => void;
  /** Right-click a scheduled block to open delete (etc.). */
  onBlockContextMenu: (blockId: string, x: number, y: number) => void;
};

function formatHourLabel(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}

export function DayCalendar({
  day,
  blocks,
  draft,
  picking,
  onDraftCommit,
  onDraftPreview,
  onBlockContextMenu,
}: DayCalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragStartMinutes = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const pointerMinutes = useCallback((clientY: number) => {
    const el = gridRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return yToMinutes(clientY - rect.top);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (picking) return;
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = pointerMinutes(event.clientY);
    dragStartMinutes.current = start;
    setDragging(true);
    const maxMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
    const startAt = dateFromDayMinutes(day, start);
    const endAt = dateFromDayMinutes(day, Math.min(start + 15, maxMinutes));
    onDraftPreview({ startAt, endAt });
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || dragStartMinutes.current === null) return;
    const maxMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
    const current = pointerMinutes(event.clientY);
    const a = Math.min(dragStartMinutes.current, current);
    const b = Math.max(dragStartMinutes.current, current);
    // Enforce at least one snap step while dragging.
    const end = b === a ? a + 15 : b;
    onDraftPreview({
      startAt: dateFromDayMinutes(day, a),
      endAt: dateFromDayMinutes(day, Math.min(end, maxMinutes)),
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || dragStartMinutes.current === null) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    const maxMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
    const current = pointerMinutes(event.clientY);
    const a = Math.min(dragStartMinutes.current, current);
    const b = Math.max(dragStartMinutes.current, current);
    dragStartMinutes.current = null;
    const end = b === a ? a + 15 : b;
    const startAt = dateFromDayMinutes(day, a);
    const endAt = dateFromDayMinutes(day, Math.min(end, maxMinutes));
    if (endAt.getTime() - startAt.getTime() < 15 * 60 * 1000) {
      onDraftPreview(null);
      return;
    }
    onDraftCommit({ startAt, endAt });
  }

  const height = gridHeightPx();
  const hours = hourLabels();

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {day.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </h2>
        <span className="rounded-md bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
          Today
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-w-[28rem]">
          {/* Hour gutter */}
          <div
            className="relative w-16 shrink-0 border-r border-[var(--border)]"
            style={{ height }}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-xs text-[var(--muted)]"
                style={{ top: minutesToY((hour - DAY_START_HOUR) * 60) }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Interactive grid */}
          <div
            ref={gridRef}
            className={`relative flex-1 touch-none ${
              picking ? "cursor-default" : "cursor-crosshair"
            }`}
            style={{ height }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              setDragging(false);
              dragStartMinutes.current = null;
              if (!picking) onDraftPreview(null);
            }}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-0 left-0 border-t border-[var(--border)]"
                style={{ top: minutesToY((hour - DAY_START_HOUR) * 60) }}
              />
            ))}

            {blocks.map((block) => {
              const start = new Date(block.startAt);
              const end = new Date(block.endAt);
              const top = minutesToY(minutesFromDayStart(start, day));
              const bottom = minutesToY(minutesFromDayStart(end, day));
              const color = block.task.folder.color;
              return (
                <div
                  key={block.id}
                  className="absolute right-2 left-2 z-[1] overflow-hidden rounded-md border border-black/5 px-2 py-1"
                  style={{
                    top,
                    height: Math.max(bottom - top, 20),
                    backgroundColor: softFill(color),
                    borderLeft: `3px solid ${color}`,
                  }}
                  // Don't start a new drag when interacting with an existing block.
                  onPointerDown={(e) => e.stopPropagation()}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (picking) return;
                    onBlockContextMenu(block.id, e.clientX, e.clientY);
                  }}
                >
                  <div className="truncate text-xs font-semibold text-[var(--foreground)]">
                    {block.task.folder.name} — {block.task.title}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
                    <span>
                      {formatClock(start)} – {formatClock(end)}
                    </span>
                    <span>{formatDuration(start, end)}</span>
                  </div>
                </div>
              );
            })}

            {draft && (
              <div
                className="pointer-events-none absolute right-2 left-2 rounded-md border border-dashed border-[var(--brand)] bg-[var(--brand)]/10"
                style={{
                  top: minutesToY(minutesFromDayStart(draft.startAt, day)),
                  height: Math.max(
                    minutesToY(minutesFromDayStart(draft.endAt, day)) -
                      minutesToY(minutesFromDayStart(draft.startAt, day)),
                    20,
                  ),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
