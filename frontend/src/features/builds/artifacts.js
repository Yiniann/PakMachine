import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useArtifacts = (limit) => useQuery({
    queryKey: ["artifacts", limit],
    queryFn: async () => {
        const res = await api.get("/build/artifacts", { params: { limit } });
        return res.data;
    },
});
