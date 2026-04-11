import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useTemplateFiles = () => useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
        const res = await api.get("/build/templates");
        return res.data;
    },
});
export const useGithubTemplates = () => useQuery({
    queryKey: ["github-templates"],
    queryFn: async () => {
        const res = await api.get("/admin/github-templates");
        return res.data;
    },
    staleTime: 30000,
});
export const useAdminBuildJobs = (limit = 100) => useQuery({
    queryKey: ["admin-build-jobs", limit],
    queryFn: async () => {
        const res = await api.get("/admin/build-jobs", { params: { limit } });
        return res.data;
    },
    staleTime: 10000,
});
