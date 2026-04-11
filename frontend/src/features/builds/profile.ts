import { useMutation, useQuery, UseMutationResult, UseQueryResult, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../components/useAuth";

export type BuildProfile = Record<string, unknown> | null;

export const useBuildProfile = (siteId?: number | null): UseQueryResult<BuildProfile> => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["build-profile", token, siteId ?? null],
    queryFn: async () => {
      const res = await api.get("/build/profile", { params: siteId ? { siteId } : undefined });
      return res.data;
    },
    enabled: Boolean(token),
  });
};

export const useSaveBuildProfile = (): UseMutationResult<BuildProfile, unknown, { config: BuildProfile; siteId?: number | null }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ config, siteId }) => {
      const res = await api.put("/build/profile", { config, siteId: siteId ?? null });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-profile"] });
    },
  });
};
