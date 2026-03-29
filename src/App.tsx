import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText, Share2 } from "lucide-react";
import { AppSidebar } from "./components/app-sidebar";
import { DiagramPreview } from "./components/diagram-preview";
import { DiagramDialog } from "./components/diagram-dialog";
import { FolderDialog } from "./components/folder-dialog";
import { ShareDiagramDialog } from "./components/share-diagram-dialog";
import {
  decodeShareFromLocation,
  clearShareHashFromLocation,
  encodeShareLink,
  copyTextToClipboard,
  SHARE_HASH_KEY,
} from "./lib/share-link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDiagrams,
  useCreateDiagram,
  useCreateFolder,
  useUpdateDiagram,
  useDeleteDiagram,
} from "./hooks/use-diagrams";

const queryClient = new QueryClient();

type SharedViewState = { name: string; mermaid_code: string };

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
  const [deleteDiagramDialogOpen, setDeleteDiagramDialogOpen] = React.useState(false);
  const [sharedView, setSharedView] = React.useState<SharedViewState | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const applyHash = () => {
      const r = decodeShareFromLocation();
      if (r.ok) {
        setSharedView({ name: r.name, mermaid_code: r.mermaid_code });
        return;
      }
      setSharedView(null);
      const h = window.location.hash;
      if (r.reason === "invalid" && h.startsWith(`#${SHARE_HASH_KEY}=`)) {
        clearShareHashFromLocation();
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

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

  const showPreview = sharedView !== null || selectedDiagram !== null;
  const previewName = sharedView?.name ?? selectedDiagram?.name ?? "";
  const previewCode = sharedView?.mermaid_code ?? selectedDiagram?.mermaid_code ?? "";

  const handleDismissShared = () => {
    setSharedView(null);
    clearShareHashFromLocation();
  };

  const handleCopySharedLink = async () => {
    if (!sharedView) return;
    const r = encodeShareLink(sharedView.name, sharedView.mermaid_code);
    if (!r.ok) {
      alert(r.error);
      return;
    }
    const ok = await copyTextToClipboard(r.fullUrl);
    if (!ok) alert("Could not copy link.");
  };

  const handleImportShared = async () => {
    if (!sharedView) return;
    try {
      const created = await createMutation.mutateAsync({
        name: sharedView.name,
        mermaid_code: sharedView.mermaid_code,
        parent_id: null,
      });
      setSelectedId(created.id);
      setSharedView(null);
      clearShareHashFromLocation();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Import failed");
    }
  };

  const sharedBanner =
    sharedView !== null ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          You are viewing a shared diagram. Nothing is saved to your library until you import it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" className="h-8" onClick={handleCopySharedLink}>
            Copy link
          </Button>
          <Button size="sm" className="h-8" onClick={handleImportShared}>
            Import to library
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={handleDismissShared}>
            Dismiss
          </Button>
        </div>
      </div>
    ) : null;

  const mergedLeading = (
    <>
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="h-4 shrink-0" />
      {showPreview ? (
        <>
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-semibold">{previewName}</span>
        </>
      ) : null}
    </>
  );

  const mergedTrailing =
    sharedView !== null ? null : selectedDiagram != null ? (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={handleEdit}>
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-destructive hover:text-destructive"
          onClick={() => setDeleteDiagramDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </>
    ) : null;

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
      <SidebarInset className="flex min-h-0 flex-1 flex-col">
        {showPreview ? (
          <DiagramPreview
            className="min-h-0 flex-1"
            code={previewCode}
            leadingToolbar={mergedLeading}
            trailingToolbar={mergedTrailing}
            topBanner={sharedBanner ?? undefined}
          />
        ) : (
          <>
            <header className="flex min-h-10 shrink-0 items-center gap-2 border-b bg-background px-3 py-1.5">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Separator orientation="vertical" className="h-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {isLoading ? "Loading..." : "Select a diagram or create a new one"}
              </span>
            </header>
            <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden text-muted-foreground">
              <img
                src="/logo.svg"
                alt=""
                width={80}
                height={80}
                className="mb-4 h-20 w-20 rounded-2xl shadow-sm"
              />
              <p className="text-lg font-medium">No diagram selected</p>
              <p className="text-sm">Create a new diagram or select one from the sidebar</p>
              <Button className="mt-4" onClick={handleCreate}>
                Create Diagram
              </Button>
            </main>
          </>
        )}
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

      <ShareDiagramDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        name={selectedDiagram?.name ?? ""}
        mermaid_code={selectedDiagram?.mermaid_code ?? ""}
      />

      <Dialog
        open={deleteDiagramDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteDiagramDialogOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete diagram</DialogTitle>
            <DialogDescription>
              {selectedDiagram ? (
                <>
                  Are you sure you want to delete &quot;{selectedDiagram.name}&quot;? This cannot be
                  undone.
                </>
              ) : (
                "This diagram is no longer selected."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDiagramDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDiagram) {
                  handleDelete(selectedDiagram.id);
                  setDeleteDiagramDialogOpen(false);
                }
              }}
              disabled={!selectedDiagram}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
