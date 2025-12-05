import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export interface User {
  id: number;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUsersQuery = (): UseQueryResult<User[], unknown> =>
  useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<User[]>("/admin/getUsers");
      return res.data;
    },
  });
