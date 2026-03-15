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
import {
  useDiagrams,
  useCreateDiagram,
  useUpdateDiagram,
  useDeleteDiagram,
} from "./hooks/use-diagrams";
import type { Diagram } from "./types";

const queryClient = new QueryClient();

function AppContent() {
  const { data: diagrams = [], isLoading } = useDiagrams();
  const createMutation = useCreateDiagram();
  const updateMutation = useUpdateDiagram();
  const deleteMutation = useDeleteDiagram();

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");

  const selectedDiagram = React.useMemo(
    () => diagrams.find((d) => d.id === selectedId) || null,
    [diagrams, selectedId]
  );

  const handleCreate = () => {
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedDiagram) {
      setDialogMode("edit");
      setIsDialogOpen(true);
    }
  };

  const handleSave = (name: string, code: string) => {
    if (dialogMode === "create") {
      createMutation.mutate(
        { name, mermaid_code: code },
        {
          onSuccess: (newDiagram: Diagram) => {
            setSelectedId(newDiagram.id);
          },
        }
      );
    } else if (dialogMode === "edit" && selectedId) {
      updateMutation.mutate({ id: selectedId, input: { name, mermaid_code: code } });
    }
  };

  const handleRename = (id: number, name: string) => {
    updateMutation.mutate({ id, input: { name } });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) {
          setSelectedId(null);
        }
      },
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar
        diagrams={diagrams}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
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

      {/* Dialog */}
      <DiagramDialog
        diagram={selectedDiagram}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        mode={dialogMode}
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
