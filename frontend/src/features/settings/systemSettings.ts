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

export type ClientBaseStorageConfig = {
  configured: boolean;
  source: "settings" | "environment" | "none";
  accountId: string | null;
  bucket: string | null;
  credentialsConfigured: boolean;
  releaseTokenConfigured: boolean;
  releaseTokenSource: "settings" | "environment" | "none";
  releaseTokenCreatedAt: string | null;
  updatedAt: string | null;
};

export type ClientBaseStorageInput = {
  accountId: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export type ClientBaseReleaseTokenResult = {
  releaseToken: string;
  createdAt: string;
  config: ClientBaseStorageConfig;
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

export const useClientBaseStorageConfig = (): UseQueryResult<ClientBaseStorageConfig> =>
  useQuery({
    queryKey: ["client-base-storage"],
    queryFn: async () => {
      const res = await api.get("/admin/client-base-storage");
      return res.data as ClientBaseStorageConfig;
    },
  });

export const useSaveClientBaseStorage = (): UseMutationResult<ClientBaseStorageConfig, unknown, ClientBaseStorageInput, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.put("/admin/client-base-storage", payload);
      return res.data as ClientBaseStorageConfig;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-base-storage"] }),
  });
};

export const useTestClientBaseStorage = (): UseMutationResult<{ ok: true; checkedAt: string }, unknown, void, unknown> =>
  useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/client-base-storage/test");
      return res.data as { ok: true; checkedAt: string };
    },
  });

export const useRotateClientBaseReleaseToken = (): UseMutationResult<ClientBaseReleaseTokenResult, unknown, void, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/client-base-storage/release-token");
      return res.data as ClientBaseReleaseTokenResult;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-base-storage"] }),
  });
};
