import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";

export type ClientControlBrand = {
  id: number;
  name: string;
  appId: string | null;
  publisher: string;
  iconUrl: string | null;
  ready: boolean;
};

export type ClientBffActivation = {
  activationToken: string;
  expiresAt: string;
};

export type ClientRuntimeArchitecture = "amd64" | "arm64";

export type ClientRuntimePackage = {
  jobId: number;
  filename: string;
  downloadUrl: string;
  downloadExpiresAt: string;
  installCommand: string;
  architecture: ClientRuntimeArchitecture;
  version: string;
  size: number;
  sha256: string;
};

export const useClientControlBrands = () =>
  useQuery<ClientControlBrand[]>({
    queryKey: ["client-control-brands"],
    queryFn: async () => {
      const response = await api.get<{ brands: ClientControlBrand[] }>("/client-control/brands");
      return response.data.brands;
    },
  });

export const useCreateClientBffActivation = () =>
  useMutation({
    mutationFn: async () => {
      const response = await api.post<ClientBffActivation>("/client-control/activation", {});
      return response.data;
    },
  });

export const useCreateClientRuntimePackage = () =>
  useMutation({
    mutationFn: async (input: { architecture: ClientRuntimeArchitecture; siteId: number }) => {
      const response = await api.post<ClientRuntimePackage>("/client-control/runtime-package", input);
      return response.data;
    },
  });

export const useSaveClientBrandIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { siteId: number; publisher: string; iconUrl: string }) => {
      const response = await api.put<ClientControlBrand & { siteId: number; iconSha256: string | null }>(
        `/client-control/brands/${input.siteId}`,
        { publisher: input.publisher, iconUrl: input.iconUrl },
      );
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-control-brands"] }),
  });
};
