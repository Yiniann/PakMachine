import { useMutation } from "@tanstack/react-query";
import api from "../../api/client";
export const useLoginMutation = () => useMutation({
    mutationFn: async (variables) => {
        const res = await api.post("/auth/login", variables);
        return res.data;
    },
});
export const useRegisterMutation = () => useMutation({
    mutationFn: async (variables) => {
        const res = await api.post("/auth/register", variables);
        return res.data;
    },
});
export const useSendRegisterCodeMutation = () => useMutation({
    mutationFn: async (variables) => {
        const res = await api.post("/auth/register/send-code", variables);
        return res.data;
    },
});
export const useForgotPasswordMutation = () => useMutation({
    mutationFn: async (variables) => {
        const res = await api.post("/auth/forgot-password", variables);
        return res.data;
    },
});
export const useResetPasswordMutation = () => useMutation({
    mutationFn: async (variables) => {
        const res = await api.post("/auth/reset-password", variables);
        return res.data;
    },
});
