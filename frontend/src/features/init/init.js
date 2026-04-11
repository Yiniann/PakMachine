import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useInitStatus = () => useQuery({
    queryKey: ["init-status"],
    queryFn: async () => {
        const res = await api.get("/init");
        return res.data;
    },
    staleTime: 60000,
});
export const useInitializeSystem = () => useMutation({
    mutationFn: async (payload) => {
        const res = await api.post("/init", payload);
        return res.data;
    },
});
export const useSaveDatabaseUrl = () => useMutation({
    mutationFn: async (payload) => {
        const res = await api.post("/init/database", payload);
        return res.data;
    },
});
