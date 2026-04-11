import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useMyTickets = () => useQuery({
    queryKey: ["support-tickets", "mine"],
    queryFn: async () => {
        const res = await api.get("/tickets");
        return res.data;
    },
    refetchInterval: 4000,
});
export const useAdminTickets = (status) => useQuery({
    queryKey: ["support-tickets", "admin", status],
    queryFn: async () => {
        const res = await api.get("/admin/tickets", {
            params: status === "all" ? undefined : { status },
        });
        return res.data;
    },
    refetchInterval: 4000,
});
export const useAdminTicket = (id) => useQuery({
    queryKey: ["support-tickets", "admin", "detail", id],
    queryFn: async () => {
        const res = await api.get(`/admin/tickets/${id}`);
        return res.data;
    },
    enabled: typeof id === "number" && Number.isInteger(id),
    refetchInterval: 4000,
});
export const useMyTicket = (id) => useQuery({
    queryKey: ["support-tickets", "mine", "detail", id],
    queryFn: async () => {
        const res = await api.get(`/tickets/${id}`);
        return res.data;
    },
    enabled: typeof id === "number" && Number.isInteger(id),
    refetchInterval: 4000,
});
