import type {
  Diagram,
  CreateDiagramInput,
  CreateFolderInput,
  UpdateDiagramInput,
} from "@/types";

const STORAGE_KEY = "mermaid-diagrams";

function isLegacyRow(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return true;
  const o = raw as Record<string, unknown>;
  return !("kind" in o) || !("parent_id" in o);
}

function migrateRow(raw: unknown): Diagram | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "number" ? r.id : Number(r.id);
  if (!Number.isFinite(id)) return null;
  const name = String(r.name ?? "");
  const kind = r.kind === "folder" ? "folder" : "diagram";
  const parent_id =
    r.parent_id === undefined || r.parent_id === null ? null : Number(r.parent_id);
  let mermaid_code = typeof r.mermaid_code === "string" ? r.mermaid_code : "";
  if (kind === "folder") mermaid_code = "";
  const updated_at =
    typeof r.updated_at === "number" ? r.updated_at : Math.floor(Date.now() / 1000);
  return { id, name, kind, parent_id, mermaid_code, updated_at };
}

function getDiagrams(): Diagram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    let needsSave = false;
    const out: Diagram[] = [];
    for (const item of parsed) {
      const row = migrateRow(item);
      if (row) {
        out.push(row);
        if (isLegacyRow(item)) needsSave = true;
      }
    }
    if (needsSave) saveDiagrams(out);
    return out;
  } catch {
    return [];
  }
}

function saveDiagrams(diagrams: Diagram[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function siblingNameTaken(
  diagrams: Diagram[],
  parent_id: number | null,
  name: string,
  excludeId?: number
): boolean {
  const n = normalizeName(name);
  return diagrams.some(
    (d) =>
      d.parent_id === parent_id &&
      normalizeName(d.name) === n &&
      d.id !== excludeId
  );
}

function findParent(diagrams: Diagram[], parent_id: number | null): Diagram | null {
  if (parent_id === null) return null;
  const p = diagrams.find((d) => d.id === parent_id);
  return p ?? null;
}

function assertValidParent(diagrams: Diagram[], parent_id: number | null): void {
  if (parent_id === null) return;
  const p = findParent(diagrams, parent_id);
  if (!p || p.kind !== "folder") {
    throw new Error("Parent folder not found");
  }
}

/** All ids in the subtree rooted at rootId (including rootId). */
function getSubtreeIds(diagrams: Diagram[], rootId: number): Set<number> {
  const byParent = new Map<number | null, Diagram[]>();
  for (const d of diagrams) {
    const list = byParent.get(d.parent_id) ?? [];
    list.push(d);
    byParent.set(d.parent_id, list);
  }
  const out = new Set<number>();
  const walk = (id: number) => {
    out.add(id);
    for (const c of byParent.get(id) ?? []) walk(c.id);
  };
  walk(rootId);
  return out;
}

function wouldCreateCycle(
  diagrams: Diagram[],
  itemId: number,
  newParentId: number | null
): boolean {
  if (newParentId === null) return false;
  if (newParentId === itemId) return true;
  const subtree = getSubtreeIds(diagrams, itemId);
  return subtree.has(newParentId);
}

export async function fetchDiagrams(): Promise<Diagram[]> {
  const diagrams = getDiagrams();
  return [...diagrams].sort((a, b) => b.updated_at - a.updated_at);
}

export async function fetchDiagram(id: number): Promise<Diagram> {
  const diagrams = getDiagrams();
  const diagram = diagrams.find((d) => d.id === id);
  if (!diagram) throw new Error("Failed to fetch diagram");
  return diagram;
}

export async function createFolder(input: CreateFolderInput): Promise<Diagram> {
  const name = input.name.trim();
  if (!name) throw new Error("Folder name required");
  const parent_id = input.parent_id ?? null;
  const diagrams = getDiagrams();
  assertValidParent(diagrams, parent_id);
  if (siblingNameTaken(diagrams, parent_id, name)) {
    throw new Error("A folder or diagram with this name already exists here");
  }
  const nextId = Math.max(0, ...diagrams.map((d) => d.id), 0) + 1;
  const now = Math.floor(Date.now() / 1000);
  const folder: Diagram = {
    id: nextId,
    name,
    mermaid_code: "",
    kind: "folder",
    parent_id,
    updated_at: now,
  };
  diagrams.push(folder);
  saveDiagrams(diagrams);
  return folder;
}

export async function createDiagram(input: CreateDiagramInput): Promise<Diagram> {
  const diagrams = getDiagrams();
  const parent_id = input.parent_id ?? null;
  assertValidParent(diagrams, parent_id);
  const name = input.name.trim();
  if (!name) throw new Error("Name required");
  if (siblingNameTaken(diagrams, parent_id, name)) {
    throw new Error("A folder or diagram with this name already exists here");
  }
  const nextId = Math.max(0, ...diagrams.map((d) => d.id), 0) + 1;
  const now = Math.floor(Date.now() / 1000);
  const diagram: Diagram = {
    id: nextId,
    name,
    mermaid_code: input.mermaid_code,
    kind: "diagram",
    parent_id,
    updated_at: now,
  };
  diagrams.push(diagram);
  saveDiagrams(diagrams);
  return diagram;
}

export async function updateDiagram(
  id: number,
  input: UpdateDiagramInput
): Promise<Diagram> {
  const diagrams = getDiagrams();
  const index = diagrams.findIndex((d) => d.id === id);
  if (index === -1) throw new Error("Failed to update diagram");
  const existing = diagrams[index]!;

  let parent_id = existing.parent_id;
  if (input.parent_id !== undefined) {
    parent_id = input.parent_id;
    assertValidParent(diagrams, parent_id);
    if (wouldCreateCycle(diagrams, id, parent_id)) {
      throw new Error("Cannot move folder into itself or a descendant");
    }
  }

  let name = existing.name;
  if (input.name !== undefined) {
    name = input.name.trim();
    if (!name) throw new Error("Name required");
    if (siblingNameTaken(diagrams, parent_id, name, id)) {
      throw new Error("A folder or diagram with this name already exists here");
    }
  }

  let mermaid_code = existing.mermaid_code;
  if (input.mermaid_code !== undefined) {
    if (existing.kind === "folder") {
      mermaid_code = "";
    } else {
      mermaid_code = input.mermaid_code;
    }
  }

  const updated: Diagram = {
    ...existing,
    name,
    mermaid_code,
    parent_id,
    updated_at: Math.floor(Date.now() / 1000),
  };
  diagrams[index] = updated;
  saveDiagrams(diagrams);
  return updated;
}

/** Deletes item and all descendants (cascade for folders). */
export async function deleteDiagram(id: number): Promise<void> {
  const diagrams = getDiagrams();
  const target = diagrams.find((d) => d.id === id);
  if (!target) throw new Error("Failed to delete diagram");
  const toRemove = getSubtreeIds(diagrams, id);
  const filtered = diagrams.filter((d) => !toRemove.has(d.id));
  saveDiagrams(filtered);
}
