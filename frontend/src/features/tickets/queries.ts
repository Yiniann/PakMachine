import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";
import { SupportTicket, TicketStatus } from "./types";

export const useMyTickets = (): UseQueryResult<SupportTicket[], unknown> =>
  useQuery({
    queryKey: ["support-tickets", "mine"],
    queryFn: async () => {
      const res = await api.get<SupportTicket[]>("/tickets");
      return res.data;
    },
    refetchInterval: 4000,
  });

export const useAdminTickets = (status: TicketStatus | "all"): UseQueryResult<SupportTicket[], unknown> =>
  useQuery({
    queryKey: ["support-tickets", "admin", status],
    queryFn: async () => {
      const res = await api.get<SupportTicket[]>("/admin/tickets", {
        params: status === "all" ? undefined : { status },
      });
      return res.data;
    },
    refetchInterval: 4000,
  });

export const useAdminTicket = (id: number | null): UseQueryResult<SupportTicket, unknown> =>
  useQuery({
    queryKey: ["support-tickets", "admin", "detail", id],
    queryFn: async () => {
      const res = await api.get<SupportTicket>(`/admin/tickets/${id}`);
      return res.data;
    },
    enabled: typeof id === "number" && Number.isInteger(id),
    refetchInterval: 4000,
  });

export const useMyTicket = (id: number | null): UseQueryResult<SupportTicket, unknown> =>
  useQuery({
    queryKey: ["support-tickets", "mine", "detail", id],
    queryFn: async () => {
      const res = await api.get<SupportTicket>(`/tickets/${id}`);
      return res.data;
    },
    enabled: typeof id === "number" && Number.isInteger(id),
    refetchInterval: 4000,
  });
