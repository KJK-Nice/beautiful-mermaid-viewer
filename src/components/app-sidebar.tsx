import * as React from "react";
import { Plus, ChevronRight, ChevronDown, FolderOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileTreeItem } from "./file-tree-item";
import type { Diagram } from "@/types";

interface AppSidebarProps {
  diagrams: Diagram[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export function AppSidebar({
  diagrams,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: AppSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          <span className="font-semibold group-data-[collapsible=icon]:hidden">
            Mermaid Viewer
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Diagrams
          </SidebarGroupLabel>
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <div className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
                <span className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>My Diagrams</span>
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu className="mt-1">
                {diagrams.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                    No diagrams yet
                  </div>
                ) : (
                  diagrams.map((diagram) => (
                    <FileTreeItem
                      key={diagram.id}
                      diagram={diagram}
                      isSelected={selectedId === diagram.id}
                      onSelect={() => onSelect(diagram.id)}
                      onRename={(name) => onRename(diagram.id, name)}
                      onDelete={() => onDelete(diagram.id)}
                    />
                  ))
                )}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <Button
          onClick={onCreate}
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">New Diagram</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
