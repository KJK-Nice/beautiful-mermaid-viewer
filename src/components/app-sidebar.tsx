import * as React from "react";
import { Plus, FolderPlus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DiagramTreeView } from "./diagram-tree-view";
import { buildDiagramTree } from "@/lib/diagram-tree";
import type { Diagram } from "@/types";

interface AppSidebarProps {
  diagrams: Diagram[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onCreateFolder: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
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
  onCreateDiagramInFolder,
  onCreateFolderInFolder,
}: AppSidebarProps) {
  const tree = React.useMemo(() => buildDiagramTree(diagrams), [diagrams]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
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
              onCreateDiagramInFolder={onCreateDiagramInFolder}
              onCreateFolderInFolder={onCreateFolderInFolder}
              depth={0}
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
    </Sidebar>
  );
}
