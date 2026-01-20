import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";

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
