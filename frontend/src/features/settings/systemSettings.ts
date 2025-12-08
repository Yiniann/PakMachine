import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type SystemSettings = {
  siteName?: string;
  allowRegister?: boolean;
};

export const useSystemSettings = (): UseQueryResult<SystemSettings> =>
  useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const res = await api.get("/admin/settings");
      return res.data as SystemSettings;
    },
  });

export const useUpdateSystemSettings = (): UseMutationResult<SystemSettings, unknown, SystemSettings, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.put("/admin/settings", payload);
      return res.data as SystemSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
    },
  });
};
