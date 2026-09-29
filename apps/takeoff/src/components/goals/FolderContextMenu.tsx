"use client";

// Right-click menu for a folder row.
// Options depend on kind + task count + depth (see GoalsWorkspace for rules).

export type ContextMenuState = {
  folderId: string;
  x: number;
  y: number;
  /** Task count for this folder at menu-open time (drives leaf menu options). */
  taskCount: number;
};

type FolderContextMenuProps = {
  x: number;
  y: number;
  items: { id: string; label: string; danger?: boolean; onSelect: () => void }[];
  onClose: () => void;
};

export function FolderContextMenu({
  x,
  y,
  items,
  onClose,
}: FolderContextMenuProps) {
  return (
    <>
      {/* Click-catcher closes the menu without selecting. */}
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        aria-label="Close menu"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <ul
        className="fixed z-50 min-w-[220px] rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg"
        style={{ left: x, top: y }}
        role="menu"
      >
        {items.map((item) => (
          <li key={item.id} role="none">
            <button
              type="button"
              role="menuitem"
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-[var(--nav-active)] ${
                item.danger ? "text-red-700" : "text-[var(--foreground)]"
              }`}
              onClick={() => {
                onClose();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
