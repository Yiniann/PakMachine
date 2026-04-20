import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../components/useAuth";

export type CurrentUser = {
  id: number;
  email: string;
  role: string;
  userType?: string;
};

export const useCurrentUser = (): UseQueryResult<CurrentUser, unknown> => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["current-user", token],
    queryFn: async () => {
      const res = await api.get<CurrentUser>("/auth/me");
      return res.data;
    },
    enabled: Boolean(token),
  });
};
