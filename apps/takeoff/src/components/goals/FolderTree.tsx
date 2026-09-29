"use client";

// Expandable folder tree — middle column from the Momentum screenshot.

import type { FolderNode } from "@/lib/folderTree";

function FolderIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill={color}
        d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.2c.4 0 .8.16 1.1.44L11.8 7H18a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9z"
      />
    </svg>
  );
}

type FolderTreeProps = {
  nodes: FolderNode[];
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onContextMenu: (folderId: string, x: number, y: number) => void;
  depth?: number;
};

export function FolderTree({
  nodes,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  onContextMenu,
  depth = 0,
}: FolderTreeProps) {
  return (
    <ul className={depth === 0 ? "flex flex-col gap-0.5" : "mt-0.5 flex flex-col gap-0.5"}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0 || node.kind === "goal";
        const expanded = expandedIds.has(node.id);
        const selected = selectedId === node.id;

        return (
          <li key={node.id}>
            <div
              className={`group flex items-center gap-1 rounded-lg pr-2 ${
                selected ? "bg-[var(--nav-active)]" : "hover:bg-black/[0.03]"
              }`}
              style={{ paddingLeft: `${depth * 14 + 4}px` }}
              onContextMenu={(e) => {
                e.preventDefault();
                onSelect(node.id);
                onContextMenu(node.id, e.clientX, e.clientY);
              }}
            >
              {/* Chevron only when this node can show children. */}
              <button
                type="button"
                className={`flex h-7 w-5 shrink-0 items-center justify-center text-[var(--muted)] ${
                  hasChildren ? "opacity-100" : "opacity-0"
                }`}
                aria-label={expanded ? "Collapse" : "Expand"}
                onClick={() => hasChildren && onToggle(node.id)}
              >
                <span className="text-xs">{expanded ? "▾" : "▸"}</span>
              </button>

              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                onClick={() => onSelect(node.id)}
              >
                <FolderIcon color={node.color} />
                <span className="truncate text-sm font-medium text-[var(--foreground)]">
                  {node.name}
                </span>
              </button>
            </div>

            {hasChildren && expanded && node.children.length > 0 && (
              <FolderTree
                nodes={node.children}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggle={onToggle}
                onContextMenu={onContextMenu}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
