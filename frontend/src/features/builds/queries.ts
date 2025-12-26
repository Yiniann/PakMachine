import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type TemplateFile = {
  filename: string;
  modifiedAt?: string;
  description?: string;
};

export type GithubTemplate = {
  name: string;
  repo: string;
  branch?: string;
  workdir?: string;
  description?: string;
};

export type AdminBuildJob = {
  id: number;
  status: string;
  message?: string | null;
  artifactId?: number | null;
  filename: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
    siteName?: string | null;
  };
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
