import crypto from "crypto";
import AdmZip from "adm-zip";
import { ClientRuntimeArtifact } from "./clientRuntimeArtifactService";

type RuntimePackageInput = {
  artifact: ClientRuntimeArtifact;
  runtimeDownloadUrl: string;
  runtimeDownloadExpiresAt: Date;
  controlBaseUrl: string;
  manifestPublicKeyBase64: string;
  adminPathPrefix: string;
};

export type ClientRuntimeDeploymentPackage = {
  filename: string;
  buffer: Buffer;
  downloadExpiresAt: Date;
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
  const runtimeUrl = requireHttpsDownloadUrl(input.runtimeDownloadUrl);
  if (!(input.runtimeDownloadExpiresAt instanceof Date)
    || !Number.isFinite(input.runtimeDownloadExpiresAt.getTime())
    || input.runtimeDownloadExpiresAt.getTime() <= Date.now()) {
    throw serviceUnavailable("运行包临时下载地址已经失效，请重新生成部署包");
  }
  if (!/^[A-Za-z0-9_-]{40,8192}$/.test(input.manifestPublicKeyBase64)) {
    throw serviceUnavailable("客户端构建签名公钥不可用");
  }

  const builderSecret = crypto.randomBytes(48).toString("base64url");
  const environment = renderEnvironment({
    artifact: input.artifact,
    runtimeUrl,
    controlBaseUrl: input.controlBaseUrl,
    manifestPublicKeyBase64: input.manifestPublicKeyBase64,
    adminPathPrefix,
    builderSecret,
  });
  const zip = new AdmZip();
  zip.addFile("install.sh", Buffer.from(renderInstaller(input.artifact), "utf8"), "", 0o100700 << 16);
  zip.addFile("compose.yaml", Buffer.from(renderCompose(), "utf8"));
  zip.addFile(".env", Buffer.from(environment, "utf8"));
  zip.addFile("README.txt", Buffer.from(renderReadme({
    architecture: input.artifact.architecture,
    version: input.artifact.version,
    adminPathPrefix,
    expiresAt: input.runtimeDownloadExpiresAt,
  }), "utf8"));
  return {
    filename: `shuttle-client-server-${input.artifact.architecture}-v${input.artifact.version}.zip`,
    buffer: zip.toBuffer(),
    downloadExpiresAt: input.runtimeDownloadExpiresAt,
  };
};

function renderEnvironment(input: {
  artifact: ClientRuntimeArtifact;
  runtimeUrl: string;
  controlBaseUrl: string;
  manifestPublicKeyBase64: string;
  adminPathPrefix: string;
  builderSecret: string;
}) {
  const values: Record<string, string> = {
    RUNTIME_ARCHIVE_URL: input.runtimeUrl,
    RUNTIME_ARCHIVE_SHA256: input.artifact.sha256,
    RUNTIME_ARCHIVE_SIZE: String(input.artifact.size),
    BFF_IMAGE: input.artifact.bffImage,
    BUILDER_IMAGE: input.artifact.builderImage,
    ADMIN_PATH_PREFIX: input.adminPathPrefix,
    SHUTTLEITS_CONTROL_BASE_URL: input.controlBaseUrl,
    SHUTTLEITS_MANIFEST_PUBLIC_KEY_BASE64: input.manifestPublicKeyBase64,
    CLIENT_BUILDER_BASE_URL: "http://client-builder:8790",
    CLIENT_BUILDER_SHARED_SECRET: input.builderSecret,
    BUILDER_SHARED_SECRET: input.builderSecret,
  };
  return `${Object.entries(values).map(([key, value]) => `${key}=${quoteEnvironmentValue(value)}`).join("\n")}\n`;
}

function renderInstaller(artifact: ClientRuntimeArtifact) {
  return `#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 sudo ./install.sh 运行安装程序。" >&2
  exit 1
fi

for command in docker tar; do
  command -v "$command" >/dev/null 2>&1 || { echo "缺少命令: $command" >&2; exit 1; }
done
docker compose version >/dev/null 2>&1 || { echo "需要 Docker Compose v2。" >&2; exit 1; }

script_dir="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1091
source "$script_dir/.env"
set +a

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
archive="$work_dir/runtime.tar.gz"

if command -v curl >/dev/null 2>&1; then
  curl --fail --location --silent --show-error --output "$archive" "$RUNTIME_ARCHIVE_URL"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$archive" "$RUNTIME_ARCHIVE_URL"
else
  echo "需要 curl 或 wget 下载运行包。" >&2
  exit 1
fi

actual_size="$(stat -c '%s' "$archive")"
if [ "$actual_size" != "$RUNTIME_ARCHIVE_SIZE" ]; then
  echo "运行包大小校验失败。" >&2
  exit 1
fi
if command -v sha256sum >/dev/null 2>&1; then
  actual_sha256="$(sha256sum "$archive" | awk '{print $1}')"
else
  actual_sha256="$(shasum -a 256 "$archive" | awk '{print $1}')"
fi
if [ "$actual_sha256" != "$RUNTIME_ARCHIVE_SHA256" ]; then
  echo "运行包 SHA-256 校验失败。" >&2
  exit 1
fi

tar -xzf "$archive" -C "$work_dir"
test -f "$work_dir/bff-image.tar"
test -f "$work_dir/builder-image.tar"
test -f "$work_dir/runtime.json"
docker load --input "$work_dir/bff-image.tar"
docker load --input "$work_dir/builder-image.tar"

install_dir="/opt/shuttle-client"
install -d -m 700 "$install_dir"
install -m 600 "$script_dir/.env" "$install_dir/.env"
install -m 600 "$script_dir/compose.yaml" "$install_dir/compose.yaml"
cd "$install_dir"
docker compose --env-file .env -f compose.yaml up -d --remove-orphans

echo
echo "客户中台已启动。"
echo "反向代理目标: http://127.0.0.1:8787"
echo "管理路径: $ADMIN_PATH_PREFIX"
echo "运行版本: ${artifact.version} (${artifact.architecture})"
`;
}

function renderCompose() {
  return `name: shuttle-client

services:
  client-bff:
    image: \${BFF_IMAGE:?BFF_IMAGE is required}
    restart: unless-stopped
    env_file:
      - .env
    environment:
      HOST: 0.0.0.0
      PORT: 8787
      DATA_PATH: /data
    ports:
      - "127.0.0.1:8787:8787"
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8787/readyz"]
      interval: 30s
      timeout: 5s
      start_period: 15s
      retries: 3
    read_only: true
    volumes:
      - client-bff-data:/data
    tmpfs:
      - /tmp:size=16m,mode=1777
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    depends_on:
      client-builder:
        condition: service_healthy

  client-builder:
    image: \${BUILDER_IMAGE:?BUILDER_IMAGE is required}
    restart: unless-stopped
    env_file:
      - .env
    environment:
      HOST: 0.0.0.0
      PORT: 8790
      DATA_PATH: /data
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8790/healthz"]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3
    read_only: true
    volumes:
      - client-builder-data:/data
    tmpfs:
      - /tmp:size=64m,mode=1777
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL

volumes:
  client-bff-data:
  client-builder-data:
`;
}

function renderReadme(input: {
  architecture: string;
  version: string;
  adminPathPrefix: string;
  expiresAt: Date;
}) {
  return `Shuttle 客户中台部署包

系统架构: Linux ${input.architecture}
运行版本: ${input.version}
管理路径: ${input.adminPathPrefix}
运行包下载地址有效期至: ${input.expiresAt.toISOString()}

使用方法:
1. 将本 ZIP 解压到客户自己的 Linux 服务器。
2. 安装 Docker Engine 与 Docker Compose v2。
3. 在下载地址过期前执行: sudo ./install.sh
4. 将自己的 HTTPS 域名反向代理到 http://127.0.0.1:8787。
5. 访问 https://你的域名${input.adminPathPrefix} 完成初始化，然后使用 ShuttleITS 的一次性激活凭证连接。

Builder 只存在于 Docker 内部网络，不会开放宿主机端口。BFF 数据和构建结果保存在 Docker volume 中。
本部署包不包含源码、永久对象存储凭证或 GitHub 凭证。
`;
}

function quoteEnvironmentValue(value: string) {
  if (/[\r\n\u0000]/.test(value)) throw serviceUnavailable("部署配置包含不支持的字符");
  return `"${value.replace(/([\\"$`])/g, "\\$1")}"`;
}

function requireHttpsDownloadUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw serviceUnavailable("运行包临时下载地址不正确");
  }
  if (url.protocol !== "https:" || url.username || url.password || !url.search) {
    throw serviceUnavailable("运行包必须使用带签名的 HTTPS 临时下载地址");
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
