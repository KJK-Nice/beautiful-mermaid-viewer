import type { Diagram, CreateDiagramInput, UpdateDiagramInput } from "@/types";

const STORAGE_KEY = "mermaid-diagrams";

function getDiagrams(): Diagram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDiagrams(diagrams: Diagram[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
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

export async function createDiagram(input: CreateDiagramInput): Promise<Diagram> {
  const diagrams = getDiagrams();
  const nextId = Math.max(0, ...diagrams.map((d) => d.id), 0) + 1;
  const now = Math.floor(Date.now() / 1000);
  const diagram: Diagram = {
    id: nextId,
    name: input.name,
    mermaid_code: input.mermaid_code,
    updated_at: now,
  };
  diagrams.push(diagram);
  saveDiagrams(diagrams);
  return diagram;
}

export async function updateDiagram(id: number, input: UpdateDiagramInput): Promise<Diagram> {
  const diagrams = getDiagrams();
  const index = diagrams.findIndex((d) => d.id === id);
  if (index === -1) throw new Error("Failed to update diagram");
  const existing = diagrams[index];
  const updated: Diagram = {
    ...existing,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.mermaid_code !== undefined && { mermaid_code: input.mermaid_code }),
    updated_at: Math.floor(Date.now() / 1000),
  };
  diagrams[index] = updated;
  saveDiagrams(diagrams);
  return updated;
}

export async function deleteDiagram(id: number): Promise<void> {
  const diagrams = getDiagrams();
  const filtered = diagrams.filter((d) => d.id !== id);
  if (filtered.length === diagrams.length) throw new Error("Failed to delete diagram");
  saveDiagrams(filtered);
}
