import fs from "fs";
import path from "path";

export type ClientBaseArtifactPlatform = "macos" | "windows" | "android";

export type ClientBaseArtifact = {
  platform: ClientBaseArtifactPlatform;
  architecture: "arm64" | "x64" | "universal";
  version: string;
  buildNumber: number;
  objectKey: string;
  filename: string;
  sha256: string;
  size: number;
  sourceSha: string;
  publishedAt: string;
};

type ArtifactCatalog = Partial<Record<ClientBaseArtifactPlatform, ClientBaseArtifact>>;

const PLATFORMS = new Set<ClientBaseArtifactPlatform>(["macos", "windows", "android"]);
const ARCHITECTURES: Record<ClientBaseArtifactPlatform, ClientBaseArtifact["architecture"]> = {
  macos: "arm64",
  windows: "x64",
  android: "universal",
};
const EXTENSIONS: Record<ClientBaseArtifactPlatform, string> = {
  macos: ".zip",
  windows: ".zip",
  android: ".apk",
};

export const normalizeClientBaseArtifactPlatform = (value: unknown): ClientBaseArtifactPlatform => {
  const platform = String(value || "") as ClientBaseArtifactPlatform;
  if (!PLATFORMS.has(platform)) throw badRequest("platform 必须是 macos、windows 或 android");
  return platform;
};

export const getClientBaseArtifact = (platform: ClientBaseArtifactPlatform) => {
  const artifact = loadCatalog()[platform];
  if (!artifact) throw serviceUnavailable(`尚未发布 ${platform} 客户端基础包`);
  return artifact;
};

export const publishClientBaseArtifact = (
  platform: ClientBaseArtifactPlatform,
  input: unknown,
): ClientBaseArtifact => {
  const next = normalizeArtifact(platform, input);
  const catalog = loadCatalog();
  const current = catalog[platform];
  if (current && next.buildNumber < current.buildNumber) {
    throw conflict(`${platform} 基础包构建号不能回退`);
  }
  if (current && next.buildNumber === current.buildNumber) {
    if (sameArtifact(current, next)) return current;
    throw conflict(`${platform} 基础包构建号已经被其他产物使用`);
  }
  const artifact = Object.freeze({ ...next, publishedAt: new Date().toISOString() });
  persistCatalog({ ...catalog, [platform]: artifact });
  return artifact;
};

function normalizeArtifact(platform: ClientBaseArtifactPlatform, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw badRequest("基础包信息不正确");
  const source = input as Record<string, unknown>;
  const expectedKeys = ["architecture", "buildNumber", "filename", "objectKey", "sha256", "size", "sourceSha", "version"];
  const actualKeys = Object.keys(source).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) throw badRequest("基础包信息包含不支持的字段");

  const architecture = String(source.architecture || "");
  const version = String(source.version || "");
  const buildNumber = Number(source.buildNumber);
  const objectKey = String(source.objectKey || "");
  const filename = String(source.filename || "");
  const sha256 = String(source.sha256 || "").toLowerCase();
  const size = Number(source.size);
  const sourceSha = String(source.sourceSha || "").toLowerCase();

  if (architecture !== ARCHITECTURES[platform]) throw badRequest(`${platform} 基础包架构必须是 ${ARCHITECTURES[platform]}`);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw badRequest("基础包版本不合法");
  if (!Number.isSafeInteger(buildNumber) || buildNumber < 1 || buildNumber > 2_100_000_000) {
    throw badRequest("基础包构建号不合法");
  }
  if (!isSafeObjectKey(objectKey) || !objectKey.startsWith(`client-base-artifacts/${platform}/`)) {
    throw badRequest("基础包对象路径不合法");
  }
  if (!isSafeFilename(filename) || !filename.toLowerCase().endsWith(EXTENSIONS[platform])) {
    throw badRequest(`基础包文件名必须使用 ${EXTENSIONS[platform]} 后缀`);
  }
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw badRequest("基础包 SHA-256 不合法");
  if (!Number.isSafeInteger(size) || size < 1 || size > 2 * 1024 * 1024 * 1024) throw badRequest("基础包大小不合法");
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw badRequest("源码提交编号不合法");

  return {
    platform,
    architecture: ARCHITECTURES[platform],
    version,
    buildNumber,
    objectKey,
    filename,
    sha256,
    size,
    sourceSha,
  };
}

function loadCatalog(): ArtifactCatalog {
  const catalogPath = resolveCatalogPath();
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    throw serviceUnavailable(`客户端基础包目录无法读取：${(error as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw serviceUnavailable("客户端基础包目录格式不正确");
  }
  const catalog: ArtifactCatalog = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const platform = normalizeClientBaseArtifactPlatform(key);
    const source = value as Record<string, unknown>;
    const publishedAt = String(source.publishedAt || "");
    if (!Number.isFinite(Date.parse(publishedAt))) throw serviceUnavailable(`${platform} 基础包发布时间不合法`);
    if (source.platform !== platform) throw serviceUnavailable(`${platform} 基础包平台字段不匹配`);
    const { publishedAt: _publishedAt, platform: _storedPlatform, ...artifactSource } = source;
    const normalized = normalizeArtifact(platform, artifactSource);
    catalog[platform] = { ...normalized, publishedAt };
  }
  return catalog;
}

function persistCatalog(catalog: ArtifactCatalog) {
  const target = resolveCatalogPath();
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(catalog, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, target);
  fs.chmodSync(target, 0o600);
}

function resolveCatalogPath() {
  return path.resolve(
    process.env.CLIENT_BASE_ARTIFACTS_PATH || path.join(__dirname, "../../config/client-base-artifacts.json"),
  );
}

function isSafeObjectKey(value: string) {
  return value.length >= 1 && value.length <= 512
    && !value.startsWith("/")
    && !value.includes("\\")
    && value.split("/").every((part) => part && part !== "." && part !== ".." && /^[A-Za-z0-9._-]+$/.test(part));
}

function isSafeFilename(value: string) {
  return value.length >= 1 && value.length <= 180
    && !value.includes("/") && !value.includes("\\")
    && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

function sameArtifact(left: ClientBaseArtifact, right: Omit<ClientBaseArtifact, "publishedAt">) {
  return ["platform", "architecture", "version", "buildNumber", "objectKey", "filename", "sha256", "size", "sourceSha"]
    .every((key) => left[key as keyof ClientBaseArtifact] === right[key as keyof typeof right]);
}

function serviceError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function badRequest(message: string) { return serviceError(message, 400); }
function conflict(message: string) { return serviceError(message, 409); }
function serviceUnavailable(message: string) { return serviceError(message, 503); }
