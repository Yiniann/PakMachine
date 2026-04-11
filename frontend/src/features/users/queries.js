import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useUsersQuery = () => useQuery({
    queryKey: ["users"],
    queryFn: async () => {
        const res = await api.get("/admin/getUsers");
        return res.data;
    },
});
