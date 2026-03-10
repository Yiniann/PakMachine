import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";

export type BuildRequest = {
  filename: string;
  buildMode?: "legacy" | "bff";
  frontendEnvContent: string;
  serverEnvContent?: string;
  runtimeSettings?: Record<string, unknown> | null;
};

export type BuildResponse = {
  message?: string;
  downloadPath?: string;
  artifactId?: number;
  jobId?: number;
};

export const useBuildTemplate = (): UseMutationResult<BuildResponse, unknown, BuildRequest, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/build", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-jobs"] });
    },
  });
};
