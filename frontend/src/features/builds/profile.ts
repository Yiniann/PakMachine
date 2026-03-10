import { useMutation, useQuery, UseMutationResult, UseQueryResult, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../components/useAuth";

export type BuildProfile = Record<string, unknown> | null;

export const useBuildProfile = (): UseQueryResult<BuildProfile> => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["build-profile", token],
    queryFn: async () => {
      const res = await api.get("/build/profile");
      return res.data;
    },
    enabled: Boolean(token),
  });
};

export const useSaveBuildProfile = (): UseMutationResult<BuildProfile, unknown, BuildProfile, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config) => {
      const res = await api.put("/build/profile", { config });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-profile"] });
    },
  });
};
