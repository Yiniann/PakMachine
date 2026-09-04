import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type TemplateFile = {
  filename: string;
  modifiedAt?: string;
  description?: string;
};

export type GithubTemplate = {
  name: string;
  purpose: "web" | "client";
  repo: string;
  branch?: string;
  workdir?: string;
  workflowFile?: string;
  description?: string;
  createdAt?: string;
};

export type AdminBuildJob = {
  id: number;
  status: string;
  message?: string | null;
  buildKind: string;
  artifactId?: number | null;
  filename: string;
  envJson?: string | null;
  createdAt: string;
  user: {
    id: number;
    email: string;
    siteName?: string | null;
  };
};

export type AdminClientBuild = {
  id: string;
  source: "customer-builder" | "deployment-package" | "legacy";
  status: string;
  progress: number;
  message?: string | null;
  platform?: string | null;
  arch?: string | null;
  version?: string | null;
  buildNumber?: number | null;
  appName: string;
  artifactFilename?: string | null;
  artifactSize?: number | null;
  artifactSha256?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  user: { id: number; email: string };
  site: { id?: number | null; name?: string | null };
  instance?: { id: string; name?: string | null; status: string; lastSeenAt?: string | null } | null;
};

export const useTemplateFiles = (): UseQueryResult<TemplateFile[]> =>
  useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await api.get("/build/templates");
      return res.data;
    },
  });

export const useGithubTemplates = (): UseQueryResult<GithubTemplate[]> =>
  useQuery({
    queryKey: ["github-templates"],
    queryFn: async () => {
      const res = await api.get("/admin/github-templates");
      return res.data;
    },
    staleTime: 30_000,
  });

export const useAdminBuildJobs = (limit = 100): UseQueryResult<AdminBuildJob[]> =>
  useQuery({
    queryKey: ["admin-build-jobs", limit],
    queryFn: async () => {
      const res = await api.get("/admin/build-jobs", { params: { limit } });
      return res.data;
    },
    staleTime: 10_000,
  });

export const useAdminClientBuilds = (limit = 100): UseQueryResult<AdminClientBuild[]> =>
  useQuery<AdminClientBuild[]>({
    queryKey: ["admin-client-builds", limit],
    queryFn: async () => {
      const res = await api.get("/admin/client-builds", { params: { limit } });
      return res.data;
    },
    staleTime: 10_000,
    refetchInterval: (query) =>
      query.state.data?.some((job) => job.status === "queued" || job.status === "running") ? 5000 : false,
  });
