import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
export const useBuildTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const res = await api.post("/build", payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["build-jobs"] });
        },
    });
};
