export const DIAGRAM_TREE_DRAG_MIME = "application/x-diagram-id";

let dragSessionItemId: number | null = null;

export function diagramDragStart(itemId: number, dataTransfer: DataTransfer): void {
  dragSessionItemId = itemId;
  dataTransfer.setData(DIAGRAM_TREE_DRAG_MIME, String(itemId));
  dataTransfer.effectAllowed = "move";
}

export function diagramDragEnd(): void {
  dragSessionItemId = null;
}

/** Active drag source id during dragover (getData is often unavailable until drop). */
export function getDiagramDragSessionId(): number | null {
  return dragSessionItemId;
}

export function getDroppedDiagramId(dataTransfer: DataTransfer): number | null {
  const s = dataTransfer.getData(DIAGRAM_TREE_DRAG_MIME);
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
