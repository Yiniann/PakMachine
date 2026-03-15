import path from "path";

const artifactSuffixes = [".tar.gz", ".tgz", ".zip"];

export const detectArtifactExtension = (filename: string | null | undefined) => {
  const normalized = (filename || "").trim();
  if (!normalized) return "";
  const lower = normalized.toLowerCase();
  return artifactSuffixes.find((suffix) => lower.endsWith(suffix)) || path.extname(normalized);
};

const basenameFromOutputPath = (outputPath: string | null | undefined) => {
  const normalized = (outputPath || "").trim();
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    return path.basename(url.pathname);
  } catch {
    return path.basename(normalized);
  }
};

export const resolveArtifactFilename = (sourceFilename: string | null | undefined, outputPath: string | null | undefined) => {
  const storedName = (sourceFilename || "").trim();
  if (!storedName) {
    return basenameFromOutputPath(outputPath) || "download";
  }

  const storedExt = detectArtifactExtension(storedName);
  const outputBaseName = basenameFromOutputPath(outputPath);
  const outputExt = detectArtifactExtension(outputBaseName);

  if (storedExt === ".gz" && outputExt === ".tar.gz") {
    return `${storedName.slice(0, -storedExt.length)}${outputExt}`;
  }

  return storedName;
};

