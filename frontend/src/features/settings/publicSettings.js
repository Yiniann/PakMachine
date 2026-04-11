import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const usePublicSettings = () => useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
        const res = await api.get("/comm/config");
        return res.data;
    },
    staleTime: 5 * 60 * 1000,
});
