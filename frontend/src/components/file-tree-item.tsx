import * as React from "react";
import { FileText, Pencil, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
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

interface FileTreeItemProps {
  diagram: Diagram;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function FileTreeItem({
  diagram,
  isSelected,
  onSelect,
  onRename,
  onDelete,
}: FileTreeItemProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState(diagram.name);

  const handleRename = () => {
    if (newName.trim() && newName !== diagram.name) {
      onRename(newName.trim());
    }
    setIsRenameDialogOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton
            isActive={isSelected}
            onClick={onSelect}
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
            tooltip={diagram.name}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">
              {diagram.name}
            </span>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => {
              setNewName(diagram.name);
              setIsRenameDialogOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Diagram</DialogTitle>
            <DialogDescription>
              Enter a new name for your diagram.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              placeholder="Diagram name"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Diagram</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{diagram.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
