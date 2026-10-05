// Shared product limits for the Goals folder tree.
// Import these in services so every endpoint uses the same numbers.

/** Deepest allowed folder level (top-level folders are depth 1). */
export const MAX_FOLDER_DEPTH = 10;

/** Max folders that may share the same parent (including top-level parentId=null). */
export const MAX_FOLDER_CHILDREN = 10;

/**
 * Color palette for new folders (matches the screenshot's colored folder icons).
 * Assigned in round-robin when creating siblings under the same parent.
 */
export const FOLDER_COLORS = [
  "#3B82F6", // blue
  "#EAB308", // yellow
  "#8B5CF6", // purple
  "#F43F5E", // rose/red
  "#14B8A6", // teal
  "#F97316", // orange
  "#22C55E", // green
  "#06B6D4", // cyan
  "#A855F7", // violet
  "#EF4444", // red
] as const;

/** Fixed demo account until email auth exists. GET /me upserts this row. */
export const DEMO_USER_EMAIL = "demo@mymomentum.local";
