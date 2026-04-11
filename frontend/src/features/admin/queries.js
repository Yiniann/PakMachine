import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useAdminStats = () => useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
        const res = await api.get("/admin/stats");
        return res.data;
    },
    staleTime: 10000,
});
