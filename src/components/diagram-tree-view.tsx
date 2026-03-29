import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Diagram } from "@/types";
import type { TreeNode } from "@/lib/diagram-tree";
import { getAncestorPath } from "@/lib/diagram-tree";
import { canReparentDiagram } from "@/lib/api";
import {
  diagramDragStart,
  diagramDragEnd,
  getDiagramDragSessionId,
  getDroppedDiagramId,
} from "@/lib/diagram-dnd";
import { FileTreeItem } from "./file-tree-item";
import { cn } from "@/lib/utils";

export interface DiagramTreeViewProps {
  nodes: TreeNode[];
  allItems: Diagram[];
  selectedId: number | null;
  onSelectDiagram: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onMoveItem: (draggedId: number, newParentId: number | null) => void;
  /** When false (e.g. icon-collapsed sidebar), dragging is disabled. */
  dragEnabled?: boolean;
  onCreateDiagramInFolder: (parentId: number) => void;
  onCreateFolderInFolder: (parentId: number) => void;
  depth?: number;
}

export function DiagramTreeView({
  nodes,
  allItems,
  selectedId,
  onSelectDiagram,
  onRename,
  onDelete,
  onMoveItem,
  dragEnabled = true,
  onCreateDiagramInFolder,
  onCreateFolderInFolder,
  depth = 0,
}: DiagramTreeViewProps) {
  return (
    <SidebarMenu
      className={cn(
        depth === 0 && "mt-1",
        depth > 0 && "ml-2 border-l border-sidebar-border pl-2 mt-0.5"
      )}
    >
      {nodes.map((node) => (
        <TreeNodeRow
          key={node.item.id}
          node={node}
          allItems={allItems}
          selectedId={selectedId}
          onSelectDiagram={onSelectDiagram}
          onRename={onRename}
          onDelete={onDelete}
          onMoveItem={onMoveItem}
          dragEnabled={dragEnabled}
          onCreateDiagramInFolder={onCreateDiagramInFolder}
          onCreateFolderInFolder={onCreateFolderInFolder}
          depth={depth}
        />
      ))}
    </SidebarMenu>
  );
}

function TreeNodeRow({
  node,
  allItems,
  selectedId,
  onSelectDiagram,
  onRename,
  onDelete,
  onMoveItem,
  dragEnabled = true,
  onCreateDiagramInFolder,
  onCreateFolderInFolder,
  depth = 0,
}: Omit<DiagramTreeViewProps, "nodes"> & { node: TreeNode }) {
  if (node.item.kind === "diagram") {
    return (
      <FileTreeItem
        diagram={node.item}
        allItems={allItems}
        isSelected={selectedId === node.item.id}
        onSelect={() => onSelectDiagram(node.item.id)}
        onRename={(name) => onRename(node.item.id, name)}
        onDelete={() => onDelete(node.item.id)}
        onMoveItem={onMoveItem}
        dragEnabled={dragEnabled}
        depth={depth}
      />
    );
  }

  return (
    <FolderTreeRow
      folder={node.item}
      childrenNodes={node.children}
      allItems={allItems}
      selectedId={selectedId}
      onSelectDiagram={onSelectDiagram}
      onRename={onRename}
      onDelete={onDelete}
      onMoveItem={onMoveItem}
      dragEnabled={dragEnabled}
      onCreateDiagramInFolder={onCreateDiagramInFolder}
      onCreateFolderInFolder={onCreateFolderInFolder}
      depth={depth}
    />
  );
}

interface FolderTreeRowProps {
  folder: Diagram;
  childrenNodes: TreeNode[];
  allItems: Diagram[];
  selectedId: number | null;
  onSelectDiagram: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onMoveItem: (draggedId: number, newParentId: number | null) => void;
  dragEnabled: boolean;
  onCreateDiagramInFolder: (parentId: number) => void;
  onCreateFolderInFolder: (parentId: number) => void;
  depth: number;
}

function FolderTreeRow({
  folder,
  childrenNodes,
  allItems,
  selectedId,
  onSelectDiagram,
  onRename,
  onDelete,
  onMoveItem,
  dragEnabled,
  onCreateDiagramInFolder,
  onCreateFolderInFolder,
  depth,
}: FolderTreeRowProps) {
  const [open, setOpen] = React.useState(true);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [newName, setNewName] = React.useState(folder.name);
  const [folderDropOver, setFolderDropOver] = React.useState(false);

  const pathTooltip = getAncestorPath(allItems, folder.id).join(" / ");
  const padLeft = 8 + depth * 12;

  const folderDropNewParentId = folder.id;

  const handleFolderDragStart = (e: React.DragEvent) => {
    if (!dragEnabled) return;
    diagramDragStart(folder.id, e.dataTransfer);
  };

  const handleFolderDragEnd = () => {
    diagramDragEnd();
    setFolderDropOver(false);
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    if (!dragEnabled) return;
    const draggedId = getDiagramDragSessionId();
    if (draggedId === null) return;
    if (!canReparentDiagram(allItems, draggedId, folderDropNewParentId)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFolderDragEnter = (e: React.DragEvent) => {
    if (!dragEnabled) return;
    const draggedId = getDiagramDragSessionId();
    if (draggedId === null) return;
    if (!canReparentDiagram(allItems, draggedId, folderDropNewParentId)) return;
    e.preventDefault();
    setFolderDropOver(true);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setFolderDropOver(false);
  };

  const handleFolderDrop = (e: React.DragEvent) => {
    if (!dragEnabled) return;
    e.preventDefault();
    setFolderDropOver(false);
    diagramDragEnd();
    const draggedId = getDroppedDiagramId(e.dataTransfer);
    if (draggedId === null) return;
    if (!canReparentDiagram(allItems, draggedId, folderDropNewParentId)) return;
    onMoveItem(draggedId, folderDropNewParentId);
  };

  const handleRename = () => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== folder.name) {
      onRename(folder.id, trimmed);
    }
    setRenameOpen(false);
  };

  return (
    <>
      <SidebarMenuItem>
        <Collapsible open={open} onOpenChange={setOpen}>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  type="button"
                  draggable={dragEnabled}
                  onDragStart={handleFolderDragStart}
                  onDragEnd={handleFolderDragEnd}
                  onDragOver={handleFolderDragOver}
                  onDragEnter={handleFolderDragEnter}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={handleFolderDrop}
                  className={cn(
                    "w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center",
                    folderDropOver && dragEnabled && "bg-muted/50 ring-2 ring-primary/30 ring-inset"
                  )}
                  style={{ paddingLeft: `${padLeft}px` }}
                  tooltip={pathTooltip}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  {open ? (
                    <FolderOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate group-data-[collapsible=icon]:hidden">
                    {folder.name}
                  </span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-52">
              <ContextMenuItem onClick={() => onCreateDiagramInFolder(folder.id)}>
                <FilePlus className="mr-2 h-4 w-4" />
                New diagram
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onCreateFolderInFolder(folder.id)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New folder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => {
                  setNewName(folder.name);
                  setRenameOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete folder…
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <CollapsibleContent>
            {childrenNodes.length > 0 ? (
              <DiagramTreeView
                nodes={childrenNodes}
                allItems={allItems}
                selectedId={selectedId}
                onSelectDiagram={onSelectDiagram}
                onRename={onRename}
                onDelete={onDelete}
                onMoveItem={onMoveItem}
                dragEnabled={dragEnabled}
                onCreateDiagramInFolder={onCreateDiagramInFolder}
                onCreateFolderInFolder={onCreateFolderInFolder}
                depth={depth + 1}
              />
            ) : (
              <div className="ml-4 border-l border-sidebar-border pl-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                Empty folder
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
            <DialogDescription>Enter a new name for the folder.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete folder</DialogTitle>
            <DialogDescription>
              Delete &quot;{folder.name}&quot; and everything inside it? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => onDelete(folder.id)}>
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
