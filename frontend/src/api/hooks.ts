import { useQuery, useMutation, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import api from "./client";

export interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const useUsersQuery = (): UseQueryResult<User[], unknown> =>
  useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<User[]>("/users");
      return res.data;
    },
  });

export const useLoginMutation = (): UseMutationResult<
  { token: string; user: User },
  unknown,
  { email: string; password: string },
  unknown
> =>
  useMutation({
    mutationFn: async (variables) => {
      const res = await api.post("/users/login", variables);
      return res.data;
    },
  });

export const useRegisterMutation = (): UseMutationResult<
  User,
  unknown,
  { email: string; password: string },
  unknown
> =>
  useMutation({
    mutationFn: async (variables) => {
      const res = await api.post("/users/register", variables);
      return res.data;
    },
  });

export const useForgotPasswordMutation = (): UseMutationResult<
  { resetToken?: string; message?: string; expiresAt?: string },
  unknown,
  { email: string },
  unknown
> =>
  useMutation({
    mutationFn: async (variables) => {
      const res = await api.post("/users/forgot-password", variables);
      return res.data;
    },
  });

export const useResetPasswordMutation = (): UseMutationResult<
  { message?: string },
  unknown,
  { token: string; newPassword: string },
  unknown
> =>
  useMutation({
    mutationFn: async (variables) => {
      const res = await api.post("/users/reset-password", variables);
      return res.data;
    },
  });
