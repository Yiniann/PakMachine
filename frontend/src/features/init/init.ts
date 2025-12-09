import { useMutation, useQuery, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type InitStatus = {
  initialized: boolean;
};

export type InitPayload = {
  email: string;
  password: string;
  siteName?: string;
  allowRegister?: boolean;
  databaseUrl?: string;
};

export const useInitStatus = (): UseQueryResult<InitStatus> =>
  useQuery({
    queryKey: ["init-status"],
    queryFn: async () => {
      const res = await api.get("/init");
      return res.data as InitStatus;
    },
    staleTime: 60_000,
  });

export const useInitializeSystem = (): UseMutationResult<any, unknown, InitPayload, unknown> =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/init", payload);
      return res.data;
    },
  });

export const useSaveDatabaseUrl = (): UseMutationResult<{ success: boolean; needRestart?: boolean }, unknown, { databaseUrl: string }, unknown> =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/init/database", payload);
      return res.data;
    },
  });
