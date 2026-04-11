import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../components/useAuth";
export const useSiteProfile = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["site-profile", token],
        queryFn: async () => {
            const res = await api.get("/build/site-name");
            return res.data;
        },
        enabled: Boolean(token),
    });
};
export const useSetSiteName = () => useMutation({
    mutationFn: async ({ siteName }) => {
        const res = await api.post("/build/site-name", { siteName });
        return res.data;
    },
});
export const useAddFrontendOrigin = () => useMutation({
    mutationFn: async ({ frontendOrigin }) => {
        const res = await api.post("/build/frontend-origins", { frontendOrigin });
        return res.data;
    },
});
export const useUserSites = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["user-sites", token],
        queryFn: async () => {
            const res = await api.get("/build/sites");
            return res.data;
        },
        enabled: Boolean(token),
    });
};
export const useCreateUserSite = () => useMutation({
    mutationFn: async ({ name }) => {
        const res = await api.post("/build/sites", { name });
        return res.data;
    },
});
