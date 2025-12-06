import { useMutation, useQuery, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type BuildProfile = Record<string, unknown> | null;

export const useBuildProfile = (): UseQueryResult<BuildProfile> =>
  useQuery({
    queryKey: ["build-profile"],
    queryFn: async () => {
      const res = await api.get("/build/profile");
      return res.data;
    },
  });

export const useSaveBuildProfile = (): UseMutationResult<BuildProfile, unknown, BuildProfile, unknown> =>
  useMutation({
    mutationFn: async (config) => {
      const res = await api.put("/build/profile", { config });
      return res.data;
    },
  });
