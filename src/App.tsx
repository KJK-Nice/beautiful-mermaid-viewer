import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText } from "lucide-react";
import { AppSidebar } from "./components/app-sidebar";
import { DiagramPreview } from "./components/diagram-preview";
import { DiagramDialog } from "./components/diagram-dialog";
import { FolderDialog } from "./components/folder-dialog";
import {
  useDiagrams,
  useCreateDiagram,
  useCreateFolder,
  useUpdateDiagram,
  useDeleteDiagram,
} from "./hooks/use-diagrams";
const queryClient = new QueryClient();

function AppContent() {
  const { data: diagrams = [], isLoading } = useDiagrams();
  const createMutation = useCreateDiagram();
  const createFolderMutation = useCreateFolder();
  const updateMutation = useUpdateDiagram();
  const deleteMutation = useDeleteDiagram();

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [createParentId, setCreateParentId] = React.useState<number | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false);
  const [folderDialogParentId, setFolderDialogParentId] = React.useState<number | null>(null);

  const selectedDiagram = React.useMemo(
    () =>
      diagrams.find((d) => d.id === selectedId && d.kind === "diagram") ?? null,
    [diagrams, selectedId]
  );

  const createInFolderName = React.useMemo(() => {
    if (createParentId === null) return null;
    return diagrams.find((d) => d.id === createParentId)?.name ?? null;
  }, [diagrams, createParentId]);

  const handleCreate = () => {
    setCreateParentId(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const handleCreateDiagramInFolder = (parentId: number) => {
    setCreateParentId(parentId);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const handleOpenNewFolder = () => {
    setFolderDialogParentId(null);
    setFolderDialogOpen(true);
  };

  const handleCreateFolderInFolder = (parentId: number) => {
    setFolderDialogParentId(parentId);
    setFolderDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedDiagram) {
      setDialogMode("edit");
      setIsDialogOpen(true);
    }
  };

  const handleSave = async (name: string, code: string) => {
    try {
      if (dialogMode === "create") {
        const created = await createMutation.mutateAsync({
          name,
          mermaid_code: code,
          parent_id: createParentId ?? null,
        });
        setSelectedId(created.id);
      } else if (dialogMode === "edit" && selectedId) {
        await updateMutation.mutateAsync({
          id: selectedId,
          input: { name, mermaid_code: code },
        });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
      throw e;
    }
  };

  const handleRename = (id: number, name: string) => {
    updateMutation.mutate(
      { id, input: { name } },
      {
        onError: (e: Error) => alert(e.message),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        const subtree = new Set<number>();
        const walk = (root: number) => {
          subtree.add(root);
          for (const d of diagrams) {
            if (d.parent_id === root) walk(d.id);
          }
        };
        walk(id);
        if (selectedId !== null && subtree.has(selectedId)) {
          setSelectedId(null);
        }
      },
      onError: (e: Error) => alert(e.message),
    });
  };

  const handleSaveNewFolder = (name: string) => {
    createFolderMutation.mutate(
      { name, parent_id: folderDialogParentId },
      {
        onSuccess: () => setFolderDialogOpen(false),
        onError: (e: Error) => alert(e.message),
      }
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar
        diagrams={diagrams}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onCreateFolder={handleOpenNewFolder}
        onRename={handleRename}
        onDelete={handleDelete}
        onCreateDiagramInFolder={handleCreateDiagramInFolder}
        onCreateFolderInFolder={handleCreateFolderInFolder}
      />
      <SidebarInset className="flex flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedDiagram ? (
                <>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{selectedDiagram.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {isLoading ? "Loading..." : "Select a diagram or create a new one"}
                </span>
              )}
            </div>
            {selectedDiagram && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selectedDiagram.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {selectedDiagram ? (
            <DiagramPreview code={selectedDiagram.mermaid_code} className="h-full" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <FileText className="mb-4 h-16 w-16 opacity-20" />
              <p className="text-lg font-medium">No diagram selected</p>
              <p className="text-sm">
                Create a new diagram or select one from the sidebar
              </p>
              <Button className="mt-4" onClick={handleCreate}>
                Create Diagram
              </Button>
            </div>
          )}
        </main>
      </SidebarInset>

      <DiagramDialog
        diagram={selectedDiagram}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        mode={dialogMode}
        createInFolderName={createInFolderName}
      />

      <FolderDialog
        isOpen={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onSave={handleSaveNewFolder}
      />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
