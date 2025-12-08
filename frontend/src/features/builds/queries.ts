import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../../api/client";

export type TemplateFile = {
  filename: string;
  modifiedAt?: string;
};

export const useTemplateFiles = (): UseQueryResult<TemplateFile[]> =>
  useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await api.get("/build/templates");
      return res.data;
    },
  });
