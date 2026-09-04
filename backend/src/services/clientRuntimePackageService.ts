import { ClientRuntimeArtifact } from "./clientRuntimeArtifactService";

type RuntimePackageInput = {
  artifact: ClientRuntimeArtifact;
  runtimeDownloadUrl: string;
  runtimeDownloadExpiresAt: Date;
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

export const createClientRuntimeDeploymentPackage = (
  input: RuntimePackageInput,
): ClientRuntimeDeploymentPackage => {
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
    installCommand: "sudo ./install.sh",
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

function serviceUnavailable(message: string) { return serviceError(message, 503); }
