import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type BuildQuota = {
  limit: number;
  used: number;
  left: number;
  date: string;
};

export const useBuildQuota = (): UseQueryResult<BuildQuota> =>
  useQuery({
    queryKey: ["build-quota"],
    queryFn: async () => {
      const res = await api.get("/build/quota");
      return res.data as BuildQuota;
    },
  });
