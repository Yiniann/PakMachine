import { useMutation, UseMutationResult } from "@tanstack/react-query";
import api from "../../api/client";

export type BuildRequest = {
  filename: string;
  envContent: string;
};

export type BuildResponse = {
  message?: string;
  downloadPath?: string;
  artifactId?: number;
  jobId?: number;
};

export const useBuildTemplate = (): UseMutationResult<BuildResponse, unknown, BuildRequest, unknown> =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/build", payload);
      return res.data;
    },
  });
