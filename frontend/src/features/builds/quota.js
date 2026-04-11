import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useBuildQuota = () => useQuery({
    queryKey: ["build-quota"],
    queryFn: async () => {
        const res = await api.get("/build/quota");
        return res.data;
    },
});
