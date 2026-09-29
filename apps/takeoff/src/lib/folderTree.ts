// Turn Pluto's flat folder list into a nested tree for the Goals sidebar column.

import type { Folder } from "@/lib/api";

export type FolderNode = Folder & {
  children: FolderNode[];
};

/** Build a forest of roots (parentId === null), children sorted by sortOrder. */
export function buildFolderTree(folders: Folder[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();
  for (const folder of folders) {
    byId.set(folder.id, { ...folder, children: [] });
  }

  const roots: FolderNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const n of nodes) sortRecursive(n.children);
  };
  sortRecursive(roots);
  return roots;
}

/** Breadcrumb labels from root → selected (excluding the selected name itself optional). */
export function folderBreadcrumbs(
  folders: Folder[],
  folderId: string,
): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const chain: Folder[] = [];
  let current = byId.get(folderId);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return chain;
}
