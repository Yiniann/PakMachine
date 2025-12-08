import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type PublicSettings = {
  siteName: string | null;
};

export const usePublicSettings = (): UseQueryResult<PublicSettings> =>
  useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await api.get("/comm/config");
      return res.data as PublicSettings;
    },
    staleTime: 5 * 60 * 1000,
  });
