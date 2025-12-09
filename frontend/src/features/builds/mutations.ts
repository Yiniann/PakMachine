import { useMutation, UseMutationResult } from "@tanstack/react-query";
import api from "../../api/client";
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

export const useCreateGithubTemplate = (): UseMutationResult<
  void,
  unknown,
  { name: string; repo: string; branch?: string; workdir?: string; description?: string },
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      await api.post("/admin/github-templates", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["github-templates"] }),
  });
};

export const useDeleteGithubTemplate = (): UseMutationResult<void, unknown, string, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name) => {
      await api.delete(`/admin/github-templates/${encodeURIComponent(name)}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["github-templates"] }),
  });
};
