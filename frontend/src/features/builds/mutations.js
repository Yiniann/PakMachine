import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
export const useCreateGithubTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            await api.post("/admin/github-templates", payload);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["github-templates"] }),
    });
};
export const useDeleteGithubTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (name) => {
            await api.delete(`/admin/github-templates/${encodeURIComponent(name)}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["github-templates"] }),
    });
};
