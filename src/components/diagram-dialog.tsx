import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Diagram } from "@/types";

interface DiagramDialogProps {
  diagram: Diagram | null;
  isOpen: boolean;
  onClose: () => void;
  /** Return a Promise so the dialog can stay open when save fails (e.g. duplicate name). */
  onSave: (name: string, code: string) => void | Promise<void>;
  mode: "create" | "edit";
  /** Shown when creating inside a folder (optional). */
  createInFolderName?: string | null;
}

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

export function DiagramDialog({
  diagram,
  isOpen,
  onClose,
  onSave,
  mode,
  createInFolderName,
}: DiagramDialogProps) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && diagram) {
        setName(diagram.name);
        setCode(diagram.mermaid_code);
      } else {
        setName("");
        setCode(DEFAULT_DIAGRAM);
      }
    }
  }, [isOpen, mode, diagram]);

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) return;
    try {
      await Promise.resolve(onSave(name.trim(), code.trim()));
      onClose();
    } catch {
      // Keep dialog open on failure
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Diagram" : "Edit Diagram"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? createInFolderName
                ? `New diagram will be created in folder "${createInFolderName}". Enter a name and Mermaid code.`
                : "Enter a name and Mermaid diagram code to create a new diagram."
              : "Update your diagram name and code."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="My Diagram"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Mermaid Code</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
              placeholder="graph TD; A-->B;"
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !code.trim()}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
