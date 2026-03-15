export interface Diagram {
  id: number;
  name: string;
  mermaid_code: string;
  updated_at: number;
}

export interface CreateDiagramInput {
  name: string;
  mermaid_code: string;
}

export interface UpdateDiagramInput {
  name?: string;
  mermaid_code?: string;
}
