import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type Artifact = {
  id: number;
  sourceFilename: string;
  createdAt: string;
};

export const useArtifacts = (limit?: number): UseQueryResult<Artifact[]> =>
  useQuery({
    queryKey: ["artifacts", limit],
    queryFn: async () => {
      const res = await api.get("/build/artifacts", { params: { limit } });
      return res.data;
    },
  });
