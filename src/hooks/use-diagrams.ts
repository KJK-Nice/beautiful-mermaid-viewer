import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDiagrams,
  fetchDiagram,
  createDiagram,
  createFolder,
  updateDiagram,
  deleteDiagram,
} from "@/lib/api";
import type { CreateFolderInput, UpdateDiagramInput } from "@/types";

export function useDiagrams() {
  return useQuery({
    queryKey: ["diagrams"],
    queryFn: fetchDiagrams,
  });
}

export function useDiagram(id: number | null) {
  return useQuery({
    queryKey: ["diagrams", id],
    queryFn: () => fetchDiagram(id!),
    enabled: id !== null,
  });
}

export function useCreateDiagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDiagram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFolderInput) => createFolder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
    },
  });
}

export function useUpdateDiagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateDiagramInput }) =>
      updateDiagram(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
      queryClient.invalidateQueries({ queryKey: ["diagrams", id] });
    },
  });
}

export function useDeleteDiagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDiagram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
    },
  });
}
