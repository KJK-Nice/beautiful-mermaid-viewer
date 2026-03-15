import type { Diagram, CreateDiagramInput, UpdateDiagramInput } from "@/types";

const API_URL = "http://localhost:3001/api";

export async function fetchDiagrams(): Promise<Diagram[]> {
  const res = await fetch(`${API_URL}/diagrams`);
  if (!res.ok) throw new Error("Failed to fetch diagrams");
  return res.json();
}

export async function fetchDiagram(id: number): Promise<Diagram> {
  const res = await fetch(`${API_URL}/diagrams/${id}`);
  if (!res.ok) throw new Error("Failed to fetch diagram");
  return res.json();
}

export async function createDiagram(input: CreateDiagramInput): Promise<Diagram> {
  const res = await fetch(`${API_URL}/diagrams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create diagram");
  return res.json();
}

export async function updateDiagram(id: number, input: UpdateDiagramInput): Promise<Diagram> {
  const res = await fetch(`${API_URL}/diagrams/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update diagram");
  return res.json();
}

export async function deleteDiagram(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/diagrams/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete diagram");
}
