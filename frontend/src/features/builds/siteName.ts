import { useMutation, useQuery, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../components/useAuth";

export type SiteProfile = {
  siteName: string | null;
  frontendOrigins: string[];
  sites?: { id: number; name: string }[];
  siteNameLimit?: number;
  frontendOriginsLimit?: number;
};

export const useSiteProfile = (): UseQueryResult<SiteProfile> => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["site-profile", token],
    queryFn: async () => {
      const res = await api.get("/build/site-name");
      return res.data as SiteProfile;
    },
    enabled: Boolean(token),
  });
};

export const useSetSiteName = (): UseMutationResult<SiteProfile, unknown, { siteName: string }, unknown> =>
  useMutation({
    mutationFn: async ({ siteName }) => {
      const res = await api.post<SiteProfile>("/build/site-name", { siteName });
      return res.data;
    },
  });

export const useAddFrontendOrigin = (): UseMutationResult<{ frontendOrigins: string[] }, unknown, { frontendOrigin: string }, unknown> =>
  useMutation({
    mutationFn: async ({ frontendOrigin }) => {
      const res = await api.post<{ frontendOrigins: string[] }>("/build/frontend-origins", { frontendOrigin });
      return res.data;
    },
  });

export type UserSite = {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export const useUserSites = (): UseQueryResult<UserSite[]> => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["user-sites", token],
    queryFn: async () => {
      const res = await api.get("/build/sites");
      return res.data as UserSite[];
    },
    enabled: Boolean(token),
  });
};

export const useCreateUserSite = (): UseMutationResult<UserSite, unknown, { name: string }, unknown> =>
  useMutation({
    mutationFn: async ({ name }) => {
      const res = await api.post<UserSite>("/build/sites", { name });
      return res.data;
    },
  });
