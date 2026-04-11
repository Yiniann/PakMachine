import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../components/useAuth";
export const useBuildProfile = (siteId) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["build-profile", token, siteId ?? null],
        queryFn: async () => {
            const res = await api.get("/build/profile", { params: siteId ? { siteId } : undefined });
            return res.data;
        },
        enabled: Boolean(token),
    });
};
export const useSaveBuildProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ config, siteId }) => {
            const res = await api.put("/build/profile", { config, siteId: siteId ?? null });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["build-profile"] });
        },
    });
};
