import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type BuildJob = {
  id: number;
  status: string;
  message?: string;
  artifactId?: number;
  filename: string;
  createdAt: string;
};

export const useBuildJob = (jobId?: number): UseQueryResult<BuildJob> =>
  useQuery<BuildJob>({
    queryKey: ["build-job", jobId],
    queryFn: async () => {
      const res = await api.get(`/build/job/${jobId}`);
      return res.data as BuildJob;
    },
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const data = query.state.data as BuildJob | undefined;
      return data && (data.status === "pending" || data.status === "running") ? 2000 : false;
    },
  });

export const useBuildJobs = (): UseQueryResult<BuildJob[]> =>
  useQuery<BuildJob[]>({
    queryKey: ["build-jobs"],
    queryFn: async () => {
      const res = await api.get("/build/jobs");
      return res.data as BuildJob[];
    },
    refetchInterval: (query) => {
      const data = query.state.data as BuildJob[] | undefined;
      const hasActive = data?.some((j) => j.status === "pending" || j.status === "running");
      return hasActive ? 5000 : false;
    },
  });
