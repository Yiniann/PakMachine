const artifactSuffixes = [".tar.gz", ".tgz", ".zip"];

export const detectArtifactExtension = (filename: string | null | undefined) => {
  const normalized = (filename || "").trim();
  if (!normalized) return "";
  const lower = normalized.toLowerCase();
  return artifactSuffixes.find((suffix) => lower.endsWith(suffix)) || "";
};
