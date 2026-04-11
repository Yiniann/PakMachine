import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
export const useBuildJob = (jobId) => useQuery({
    queryKey: ["build-job", jobId],
    queryFn: async () => {
        const res = await api.get(`/build/job/${jobId}`);
        return res.data;
    },
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
        const data = query.state.data;
        return data && (data.status === "pending" || data.status === "running") ? 2000 : false;
    },
});
export const useBuildJobs = () => useQuery({
    queryKey: ["build-jobs"],
    queryFn: async () => {
        const res = await api.get("/build/jobs");
        return res.data;
    },
    refetchInterval: (query) => {
        const data = query.state.data;
        const hasActive = data?.some((j) => j.status === "pending" || j.status === "running");
        return hasActive ? 5000 : false;
    },
});
