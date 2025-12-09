import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type TemplateFile = {
  filename: string;
  modifiedAt?: string;
  description?: string;
  type?: "upload" | "github";
  repo?: string;
  branch?: string;
  workdir?: string;
};

export type GithubTemplate = {
  name: string;
  repo: string;
  branch?: string;
  workdir?: string;
  description?: string;
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
