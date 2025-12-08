import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { User } from "./queries";

export const useCreateUser = (): UseMutationResult<User, unknown, { email: string; password: string; role?: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      const res = await api.post<User>("/admin/addUser", variables);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useDeleteUser = (): UseMutationResult<{ message: string }, unknown, number, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<{ message: string }>(`/admin/deleteUser/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdatePassword = (): UseMutationResult<{ message: string }, unknown, { email: string; newPassword: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, newPassword }) => {
      const res = await api.patch<{ message: string }>(`/admin/changePwd`, { email, newPassword });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateRole = (): UseMutationResult<{ message: string }, unknown, { email: string; role: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }) => {
      const res = await api.patch<{ message: string }>(`/admin/changeRole`, { email, role });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useResetSiteName = (): UseMutationResult<{ message: string }, unknown, { email: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email }) => {
      const res = await api.patch<{ message: string }>(`/admin/resetSiteName`, { email });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useResetBuildQuota = (): UseMutationResult<{ message: string }, unknown, { email: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email }) => {
      const res = await api.patch<{ message: string }>(`/admin/resetBuildQuota`, { email });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};
