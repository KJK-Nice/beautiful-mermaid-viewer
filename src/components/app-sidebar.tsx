import * as React from "react";
import { Plus, FolderPlus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DiagramTreeView } from "./diagram-tree-view";
import { buildDiagramTree } from "@/lib/diagram-tree";
import { canReparentDiagram } from "@/lib/api";
import {
  getDiagramDragSessionId,
  getDroppedDiagramId,
  diagramDragEnd,
} from "@/lib/diagram-dnd";
import type { Diagram } from "@/types";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  diagrams: Diagram[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onCreateFolder: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onMoveItem: (draggedId: number, newParentId: number | null) => void;
  onCreateDiagramInFolder: (parentId: number) => void;
  onCreateFolderInFolder: (parentId: number) => void;
}

export function AppSidebar({
  diagrams,
  selectedId,
  onSelect,
  onCreate,
  onCreateFolder,
  onRename,
  onDelete,
  onMoveItem,
  onCreateDiagramInFolder,
  onCreateFolderInFolder,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const dragEnabled = state === "expanded";
  const tree = React.useMemo(() => buildDiagramTree(diagrams), [diagrams]);
  const [rootDropOver, setRootDropOver] = React.useState(false);

  const handleRootDragOver = (e: React.DragEvent) => {
    const id = getDiagramDragSessionId();
    if (id === null || !canReparentDiagram(diagrams, id, null)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleRootDragEnter = (e: React.DragEvent) => {
    const id = getDiagramDragSessionId();
    if (id === null || !canReparentDiagram(diagrams, id, null)) return;
    e.preventDefault();
    setRootDropOver(true);
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setRootDropOver(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setRootDropOver(false);
    diagramDragEnd();
    const id = getDroppedDiagramId(e.dataTransfer);
    if (id === null) return;
    if (canReparentDiagram(diagrams, id, null)) onMoveItem(id, null);
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel
            className={cn(
              "group-data-[collapsible=icon]:hidden transition-colors",
              dragEnabled && rootDropOver && "bg-muted/50 ring-2 ring-primary/30 ring-inset"
            )}
            onDragOver={dragEnabled ? handleRootDragOver : undefined}
            onDragEnter={dragEnabled ? handleRootDragEnter : undefined}
            onDragLeave={dragEnabled ? handleRootDragLeave : undefined}
            onDrop={dragEnabled ? handleRootDrop : undefined}
            title={dragEnabled ? "Drop here to move to library root" : undefined}
          >
            Diagrams
          </SidebarGroupLabel>
          {diagrams.length === 0 ? (
            <div className="mt-1 px-4 py-2 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
              No diagrams yet
            </div>
          ) : (
            <DiagramTreeView
              nodes={tree}
              allItems={diagrams}
              selectedId={selectedId}
              onSelectDiagram={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onMoveItem={onMoveItem}
              dragEnabled={dragEnabled}
              depth={0}
              onCreateDiagramInFolder={onCreateDiagramInFolder}
              onCreateFolderInFolder={onCreateFolderInFolder}
            />
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 flex flex-col gap-2">
        <Button
          onClick={onCreate}
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">New diagram</span>
        </Button>
        <Button
          onClick={onCreateFolder}
          variant="outline"
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
          size="sm"
        >
          <FolderPlus className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">New folder</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
