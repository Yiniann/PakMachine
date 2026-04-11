import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variables) => {
            const res = await api.post("/admin/addUser", variables);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/admin/deleteUser/${id}`);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
export const useUpdatePassword = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, newPassword }) => {
            const res = await api.patch(`/admin/changePwd`, { email, newPassword });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, role }) => {
            const res = await api.patch(`/admin/changeRole`, { email, role });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
export const useUpdateUserType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, userType }) => {
            const res = await api.patch(`/admin/changeUserType`, { email, userType });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
export const useUpdateSiteNameLimit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, siteNameLimit }) => {
            const res = await api.patch(`/admin/changeSiteNameLimit`, { email, siteNameLimit });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["site-profile"] });
            queryClient.invalidateQueries({ queryKey: ["user-sites"] });
        },
    });
};
export const useRemoveSiteName = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, siteId, siteName }) => {
            const res = await api.patch(`/admin/removeSiteName`, {
                email,
                siteId,
                siteName,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["site-profile"] });
            queryClient.invalidateQueries({ queryKey: ["user-sites"] });
        },
    });
};
export const useResetSiteName = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email }) => {
            const res = await api.patch(`/admin/resetSiteName`, { email });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["site-profile"] });
            queryClient.invalidateQueries({ queryKey: ["user-sites"] });
        },
    });
};
export const useResetFrontendOrigins = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email }) => {
            const res = await api.patch(`/admin/resetFrontendOrigins`, { email });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
export const useRemoveFrontendOrigin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, frontendOrigin }) => {
            const res = await api.patch(`/admin/removeFrontendOrigin`, { email, frontendOrigin });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
export const useResetBuildQuota = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email }) => {
            const res = await api.patch(`/admin/resetBuildQuota`, { email });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
