import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type Artifact = {
  id: number;
  sourceFilename: string;
  createdAt: string;
};

export const useArtifacts = (): UseQueryResult<Artifact[]> =>
  useQuery({
    queryKey: ["artifacts"],
    queryFn: async () => {
      const res = await api.get("/build/artifacts");
      return res.data;
    },
  });
