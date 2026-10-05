// Local-day time helpers for the Today calendar (snap, layout, labels).

/** First hour shown on the day grid (inclusive). */
export const DAY_START_HOUR = 6;
/** Last hour label on the day grid (exclusive end of the last hour row). */
export const DAY_END_HOUR = 22;
/** Pixel height of one hour row. */
export const HOUR_HEIGHT_PX = 64;
/** Drag snap in minutes. */
export const SNAP_MINUTES = 15;

const MINUTES_IN_VIEW = (DAY_END_HOUR - DAY_START_HOUR) * 60;

/** Local midnight → next midnight for "today". */
export function localDayBounds(day: Date = new Date()): { from: Date; to: Date } {
  const from = new Date(day);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

/** e.g. "Tue, Sep 29, 2026" */
export function formatDayHeading(day: Date = new Date()): string {
  return day.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Minutes from DAY_START_HOUR for a Date on the viewed day. Clamped to the grid. */
export function minutesFromDayStart(date: Date, day: Date): number {
  const start = new Date(day);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  const raw = Math.round((date.getTime() - start.getTime()) / 60000);
  return Math.max(0, Math.min(MINUTES_IN_VIEW, raw));
}

export function dateFromDayMinutes(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(DAY_START_HOUR, 0, 0, 0);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/** Y offset inside the scrollable grid → snapped minutes from day start. */
export function yToMinutes(y: number): number {
  const raw = (y / HOUR_HEIGHT_PX) * 60;
  return Math.max(0, Math.min(MINUTES_IN_VIEW, snapMinutes(raw)));
}

export function minutesToY(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT_PX;
}

export function gridHeightPx(): number {
  return (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT_PX;
}

export function hourLabels(): number[] {
  const hours: number[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) hours.push(h);
  return hours;
}

/** Soft fill from a hex folder color for calendar blocks. */
export function softFill(hex: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return `${hex}33`;
  }
  return "rgba(31, 77, 58, 0.12)";
}

/** True if [aStart, aEnd) overlaps [bStart, bEnd). */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}
