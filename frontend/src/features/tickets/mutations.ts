import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { SupportTicket, TicketCategory, TicketStatus } from "./types";

export const useCreateTicket = (): UseMutationResult<
  SupportTicket,
  unknown,
  { subject: string; category: TicketCategory; content: string },
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      const res = await api.post<SupportTicket>("/tickets", variables);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin"] });
    },
  });
};

export const useAddMyTicketMessage = (): UseMutationResult<
  SupportTicket,
  unknown,
  { id: number; content: string },
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }) => {
      const res = await api.post<SupportTicket>(`/tickets/${id}/messages`, { content });
      return res.data;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin"] });
    },
  });
};

export const useUpdateAdminTicket = (): UseMutationResult<
  SupportTicket,
  unknown,
  { id: number; status: TicketStatus },
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch<SupportTicket>(`/admin/tickets/${id}`, { status });
      return res.data;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin", "detail", variables.id] });
    },
  });
};

export const useAddAdminTicketMessage = (): UseMutationResult<
  SupportTicket,
  unknown,
  { id: number; content: string; status?: TicketStatus },
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content, status }) => {
      const res = await api.post<SupportTicket>(`/admin/tickets/${id}/messages`, { content, status });
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
