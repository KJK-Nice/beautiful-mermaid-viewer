import { Database } from "bun:sqlite";
import type { Diagram, CreateDiagramInput, UpdateDiagramInput } from "./types";

const db = new Database("diagrams.sqlite");

// Initialize schema
db.run(`
  CREATE TABLE IF NOT EXISTS diagrams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mermaid_code TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);

export function getAllDiagrams(): Diagram[] {
  const query = db.query("SELECT * FROM diagrams ORDER BY updated_at DESC");
  return query.all() as Diagram[];
}

export function getDiagramById(id: number): Diagram | null {
  const query = db.query("SELECT * FROM diagrams WHERE id = $id");
  return query.get({ $id: id }) as Diagram | null;
}

export function createDiagram(input: CreateDiagramInput): Diagram {
  const insert = db.query(`
    INSERT INTO diagrams (name, mermaid_code, updated_at)
    VALUES ($name, $mermaid_code, unixepoch())
    RETURNING *
  `);
  return insert.get({
    $name: input.name,
    $mermaid_code: input.mermaid_code,
  }) as Diagram;
}

export function updateDiagram(id: number, input: UpdateDiagramInput): Diagram | null {
  const existing = getDiagramById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: Record<string, string | number> = { $id: id };

  if (input.name !== undefined) {
    updates.push("name = $name");
    params.$name = input.name;
  }
  if (input.mermaid_code !== undefined) {
    updates.push("mermaid_code = $mermaid_code");
    params.$mermaid_code = input.mermaid_code;
  }

  if (updates.length === 0) return existing;

  updates.push("updated_at = unixepoch()");

  const update = db.query(`
    UPDATE diagrams
    SET ${updates.join(", ")}
    WHERE id = $id
    RETURNING *
  `);
  return update.get(params) as Diagram;
}

export function deleteDiagram(id: number): boolean {
  const query = db.query("DELETE FROM diagrams WHERE id = $id");
  const result = query.run({ $id: id });
  return result.changes > 0;
}

export default db;
