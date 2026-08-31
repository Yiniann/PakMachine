import { ClientRuntimeArtifact } from "./clientRuntimeArtifactService";

type RuntimePackageInput = {
  artifact: ClientRuntimeArtifact;
  runtimeDownloadUrl: string;
  runtimeDownloadExpiresAt: Date;
  adminPathPrefix: string;
};

export type ClientRuntimeDeploymentPackage = {
  filename: string;
  downloadUrl: string;
  downloadExpiresAt: string;
  installCommand: string;
  architecture: ClientRuntimeArtifact["architecture"];
  version: string;
  size: number;
  sha256: string;
};

export const normalizeAdminPathPrefix = (value: unknown) => {
  const pathPrefix = value === undefined || value === null || value === "" ? "/admin" : String(value).trim();
  if (!/^\/[A-Za-z0-9][A-Za-z0-9_-]{2,47}$/.test(pathPrefix)
    || ["/api", "/newapi", "/healthz", "/readyz"].includes(pathPrefix.toLowerCase())) {
    throw badRequest("管理路径必须是 3 到 48 位字母、数字、下划线或横线，并且不能使用系统保留路径");
  }
  return pathPrefix;
};

export const createClientRuntimeDeploymentPackage = (
  input: RuntimePackageInput,
): ClientRuntimeDeploymentPackage => {
  const adminPathPrefix = normalizeAdminPathPrefix(input.adminPathPrefix);
  const downloadUrl = requireHttpsDownloadUrl(input.runtimeDownloadUrl);
  if (!(input.runtimeDownloadExpiresAt instanceof Date)
    || !Number.isFinite(input.runtimeDownloadExpiresAt.getTime())
    || input.runtimeDownloadExpiresAt.getTime() <= Date.now()) {
    throw serviceUnavailable("部署包临时下载地址已经失效，请重新获取");
  }
  return Object.freeze({
    filename: input.artifact.filename,
    downloadUrl,
    downloadExpiresAt: input.runtimeDownloadExpiresAt.toISOString(),
    installCommand: `sudo ./install.sh --admin-path ${adminPathPrefix}`,
    architecture: input.artifact.architecture,
    version: input.artifact.version,
    size: input.artifact.size,
    sha256: input.artifact.sha256,
  });
};

function requireHttpsDownloadUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw serviceUnavailable("部署包临时下载地址不正确");
  }
  if (url.protocol !== "https:" || url.username || url.password || !url.search) {
    throw serviceUnavailable("部署包必须使用带签名的 HTTPS 临时下载地址");
  }
  return url.toString();
}

function serviceError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function badRequest(message: string) { return serviceError(message, 400); }
function serviceUnavailable(message: string) { return serviceError(message, 503); }
