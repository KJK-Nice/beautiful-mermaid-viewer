import type { Diagram } from "@/types";

export interface TreeNode {
  item: Diagram;
  children: TreeNode[];
}

function sortSiblings(a: Diagram, b: Diagram): number {
  if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

/** Build nested tree from flat items (root = parent_id null). */
export function buildDiagramTree(items: Diagram[]): TreeNode[] {
  const byParent = new Map<number | null, Diagram[]>();
  for (const d of items) {
    const list = byParent.get(d.parent_id) ?? [];
    list.push(d);
    byParent.set(d.parent_id, list);
  }

  const build = (parentId: number | null): TreeNode[] => {
    const list = (byParent.get(parentId) ?? []).slice().sort(sortSiblings);
    return list.map((item) => ({
      item,
      children: item.kind === "folder" ? build(item.id) : [],
    }));
  };

  return build(null);
}

/** Names from root to the given id (inclusive), for tooltips. */
export function getAncestorPath(items: Diagram[], id: number): string[] {
  const byId = new Map(items.map((d) => [d.id, d] as const));
  const names: string[] = [];
  let cur: Diagram | undefined = byId.get(id);
  while (cur) {
    names.unshift(cur.name);
    cur =
      cur.parent_id === null ? undefined : byId.get(cur.parent_id);
  }
  return names;
}
