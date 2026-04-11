import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
export const useSystemSettings = () => useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
        const res = await api.get("/admin/settings");
        return res.data;
    },
});
export const useUpdateSystemSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const res = await api.put("/admin/settings", payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["system-settings"] });
            queryClient.invalidateQueries({ queryKey: ["public-settings"] });
        },
    });
};
