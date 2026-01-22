import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type AdminStats = {
  totalUsers: number;
  subscriberUsers: number;
  totalBuildJobs: number;
  buildsToday: number;
  buildsLast7Days: number;
};

export const useAdminStats = (): UseQueryResult<AdminStats> =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get<AdminStats>("/admin/stats");
      return res.data;
    },
    staleTime: 10_000,
  });
