import { useMutation, UseMutationResult } from "@tanstack/react-query";
import api from "../../api/client";
import { User } from "../users/queries";

export const useLoginMutation = (): UseMutationResult<
  { token: string; user: User },
  unknown,
  { email: string; password: string },
  unknown
> =>
  useMutation({
    mutationFn: async (variables) => {
      const res = await api.post("/auth/login", variables);
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
      const res = await api.post("/auth/register", variables);
      return res.data;
    },
  });

export const useForgotPasswordMutation = (): UseMutationResult<
  { resetToken?: string; message?: string; expiresAt?: string; resetUrl?: string },
  unknown,
  { email: string },
  unknown
> =>
  useMutation({
    mutationFn: async (variables) => {
      const res = await api.post("/auth/forgot-password", variables);
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
      const res = await api.post("/auth/reset-password", variables);
      return res.data;
    },
  });
