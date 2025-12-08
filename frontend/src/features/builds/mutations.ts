import { useMutation, UseMutationResult } from "@tanstack/react-query";
import api from "../../api/client";
import { TemplateFile } from "./queries";
import { useQueryClient } from "@tanstack/react-query";

type UploadResponse = {
  filename: string;
  originalName?: string;
  size: number;
  storedAt?: string;
};

export const useUploadTemplate = (): UseMutationResult<UploadResponse, unknown, FormData, unknown> =>
  useMutation({
    mutationFn: async (formData) => {
      const res = await api.post("/admin/upload-template", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });

export const useDeleteTemplate = (): UseMutationResult<void, unknown, string, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filename) => {
      await api.delete(`/admin/upload-template/${encodeURIComponent(filename)}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
};

export const useRenameTemplate = (): UseMutationResult<void, unknown, { filename: string; newName: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filename, newName }) => {
      await api.patch(`/admin/upload-template/${encodeURIComponent(filename)}`, { newName });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
};
