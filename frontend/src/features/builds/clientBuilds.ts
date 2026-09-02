import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";

export type ClientPlatform = "macos" | "windows" | "android";

export type ClientBuildJob = {
  id: number | string;
  source: "legacy" | "customer-builder";
  status: string;
  progress?: number | null;
  message?: string | null;
  platform: ClientPlatform;
  arch?: string | null;
  version?: string | null;
  appName: string;
  artifactFilename?: string | null;
  size?: number | null;
  sha256?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  expiresAt?: string | null;
  downloadable: boolean;
};

export const useClientBuildJobs = () =>
  useQuery<ClientBuildJob[]>({
    queryKey: ["client-build-jobs"],
    queryFn: async () => {
      const response = await api.get("/client-build/jobs");
      return response.data;
    },
    refetchInterval: (query) =>
      query.state.data?.some((job) => job.status === "queued" || job.status === "running") ? 5000 : false,
  });

export const useCreateClientBuild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { platform: ClientPlatform; architecture: string; siteId?: number | null; clientEnvContent: string }) => {
      const response = await api.post("/client-build", payload);
      return response.data as { jobId: number; status: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-build-jobs"] }),
  });
};

export const requestClientDownload = async (jobId: number) => {
  const response = await api.post(`/client-build/download/${jobId}`);
  return response.data as { url: string; expiresAt: string };
};
