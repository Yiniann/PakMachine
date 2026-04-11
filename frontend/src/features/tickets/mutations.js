import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variables) => {
            const res = await api.post("/tickets", variables);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine"] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin"] });
        },
    });
};
export const useAddMyTicketMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, content }) => {
            const res = await api.post(`/tickets/${id}/messages`, { content });
            return res.data;
        },
        onSuccess: (_result, variables) => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine"] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine", "detail", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin"] });
        },
    });
};
export const useUpdateAdminTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }) => {
            const res = await api.patch(`/admin/tickets/${id}`, { status });
            return res.data;
        },
        onSuccess: (_result, variables) => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin", "detail", variables.id] });
        },
    });
};
export const useAddAdminTicketMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, content, status }) => {
            const res = await api.post(`/admin/tickets/${id}/messages`, { content, status });
            return res.data;
        },
        onSuccess: (_result, variables) => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin", "detail", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine"] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine", "detail", variables.id] });
        },
    });
};
