import { useMutation, useQuery, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../components/useAuth";

export const useSiteName = (): UseQueryResult<{ siteName: string | null }> => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["site-name", token],
    queryFn: async () => {
      const res = await api.get("/build/site-name");
      return res.data as { siteName: string | null };
    },
    enabled: Boolean(token),
  });
};

export const useSetSiteName = (): UseMutationResult<{ siteName: string }, unknown, { siteName: string }, unknown> =>
  useMutation({
    mutationFn: async ({ siteName }) => {
      const res = await api.post("/build/site-name", { siteName });
      return res.data;
    },
  });
