export type LibraryItemKind = "folder" | "diagram";

/** Single row in local storage: diagram (Mermaid source) or folder container. */
export interface Diagram {
  id: number;
  name: string;
  mermaid_code: string;
  kind: LibraryItemKind;
  parent_id: number | null;
  updated_at: number;
}

export interface CreateDiagramInput {
  name: string;
  mermaid_code: string;
  /** Parent folder id, or null for root */
  parent_id?: number | null;
}

export interface CreateFolderInput {
  name: string;
  parent_id?: number | null;
}

export interface UpdateDiagramInput {
  name?: string;
  mermaid_code?: string;
  /** Move item to another folder (null = root). Folders cannot create cycles. */
  parent_id?: number | null;
}
