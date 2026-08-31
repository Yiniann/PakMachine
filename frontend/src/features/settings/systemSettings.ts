import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type SystemSettings = {
  siteName?: string;
  allowRegister?: boolean;
  actionDispatchToken?: string;
  actionWebhookSecret?: string;
  mailerHost?: string;
  mailerPort?: number;
  mailerSecure?: boolean;
  mailerUser?: string;
  mailerPass?: string;
  mailerFrom?: string;
  passwordResetBaseUrl?: string;
  clientControlBaseUrl?: string;
};

export type ClientSigningConfig = {
  configured: boolean;
  controlBaseUrl: string | null;
  keyId: string | null;
  publicKeyBase64: string | null;
  createdAt: string | null;
};

export const useSystemSettings = (): UseQueryResult<SystemSettings> =>
  useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const res = await api.get("/admin/settings");
      return res.data as SystemSettings;
    },
  });

export const useUpdateSystemSettings = (): UseMutationResult<SystemSettings, unknown, SystemSettings, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.put("/admin/settings", payload);
      return res.data as SystemSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
    },
  });
};

export const useClientSigningConfig = (): UseQueryResult<ClientSigningConfig> =>
  useQuery({
    queryKey: ["client-signing-config"],
    queryFn: async () => {
      const res = await api.get("/admin/client-signing");
      return res.data as ClientSigningConfig;
    },
  });

export const useInitializeClientSigning = (): UseMutationResult<ClientSigningConfig, unknown, { controlBaseUrl: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/admin/client-signing/initialize", payload);
      return res.data as ClientSigningConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-signing-config"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
  });
};
