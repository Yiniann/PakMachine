import fs from "fs";
import path from "path";

export type ClientRuntimeArchitecture = "amd64" | "arm64";

export type ClientRuntimeArtifact = {
  architecture: ClientRuntimeArchitecture;
  version: string;
  buildNumber: number;
  objectKey: string;
  filename: string;
  sha256: string;
  size: number;
  sourceSha: string;
  bffImage: string;
  builderImage: string;
  publishedAt: string;
};

type RuntimeCatalog = Partial<Record<ClientRuntimeArchitecture, ClientRuntimeArtifact>>;

const ARCHITECTURES = new Set<ClientRuntimeArchitecture>(["amd64", "arm64"]);

export const normalizeClientRuntimeArchitecture = (value: unknown): ClientRuntimeArchitecture => {
  const architecture = String(value || "") as ClientRuntimeArchitecture;
  if (!ARCHITECTURES.has(architecture)) throw badRequest("architecture 必须是 amd64 或 arm64");
  return architecture;
};

export const getClientRuntimeArtifact = (architecture: ClientRuntimeArchitecture) => {
  const artifact = loadCatalog()[architecture];
  if (!artifact) throw serviceUnavailable(`尚未发布 Linux ${architecture} 客户中台运行包`);
  return artifact;
};

export const publishClientRuntimeArtifact = (
  architecture: ClientRuntimeArchitecture,
  input: unknown,
): ClientRuntimeArtifact => {
  const next = normalizeArtifact(architecture, input);
  const catalog = loadCatalog();
  const current = catalog[architecture];
  if (current && next.buildNumber < current.buildNumber) {
    throw conflict(`${architecture} 运行包构建号不能回退`);
  }
  if (current && next.buildNumber === current.buildNumber) {
    if (sameArtifact(current, next)) return current;
    throw conflict(`${architecture} 运行包构建号已经被其他产物使用`);
  }
  const artifact = Object.freeze({ ...next, publishedAt: new Date().toISOString() });
  persistCatalog({ ...catalog, [architecture]: artifact });
  return artifact;
};

function normalizeArtifact(architecture: ClientRuntimeArchitecture, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw badRequest("运行包信息不正确");
  const source = input as Record<string, unknown>;
  const expectedKeys = [
    "bffImage",
    "buildNumber",
    "builderImage",
    "filename",
    "objectKey",
    "sha256",
    "size",
    "sourceSha",
    "version",
  ];
  if (JSON.stringify(Object.keys(source).sort()) !== JSON.stringify(expectedKeys)) {
    throw badRequest("运行包信息包含不支持的字段");
  }

  const version = String(source.version || "");
  const buildNumber = Number(source.buildNumber);
  const objectKey = String(source.objectKey || "");
  const filename = String(source.filename || "");
  const sha256 = String(source.sha256 || "").toLowerCase();
  const size = Number(source.size);
  const sourceSha = String(source.sourceSha || "").toLowerCase();
  const bffImage = String(source.bffImage || "");
  const builderImage = String(source.builderImage || "");

  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw badRequest("运行包版本不合法");
  if (!Number.isSafeInteger(buildNumber) || buildNumber < 1 || buildNumber > 2_100_000_000) {
    throw badRequest("运行包构建号不合法");
  }
  if (!isSafeObjectKey(objectKey) || !objectKey.startsWith(`client-runtime-artifacts/${architecture}/`)) {
    throw badRequest("运行包对象路径不合法");
  }
  if (!isSafeFilename(filename) || !filename.endsWith(".tar.gz")) {
    throw badRequest("运行包文件名必须使用 .tar.gz 后缀");
  }
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw badRequest("运行包 SHA-256 不合法");
  if (!Number.isSafeInteger(size) || size < 1 || size > 4 * 1024 * 1024 * 1024) throw badRequest("运行包大小不合法");
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw badRequest("源码提交编号不合法");
  if (!isSafeImageReference(bffImage) || !bffImage.startsWith("shuttle-client-bff:")) {
    throw badRequest("BFF 镜像名称不合法");
  }
  if (!isSafeImageReference(builderImage) || !builderImage.startsWith("shuttle-client-builder:")) {
    throw badRequest("Builder 镜像名称不合法");
  }
  if (bffImage === builderImage) throw badRequest("BFF 和 Builder 镜像名称不能相同");

  return {
    architecture,
    version,
    buildNumber,
    objectKey,
    filename,
    sha256,
    size,
    sourceSha,
    bffImage,
    builderImage,
  };
}

function loadCatalog(): RuntimeCatalog {
  const catalogPath = resolveCatalogPath();
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    throw serviceUnavailable(`客户中台运行包目录无法读取：${(error as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw serviceUnavailable("客户中台运行包目录格式不正确");
  }
  const catalog: RuntimeCatalog = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const architecture = normalizeClientRuntimeArchitecture(key);
    const source = value as Record<string, unknown>;
    const publishedAt = String(source.publishedAt || "");
    if (!Number.isFinite(Date.parse(publishedAt))) throw serviceUnavailable(`${architecture} 运行包发布时间不合法`);
    if (source.architecture !== architecture) throw serviceUnavailable(`${architecture} 运行包架构字段不匹配`);
    const { publishedAt: _publishedAt, architecture: _storedArchitecture, ...artifactSource } = source;
    const normalized = normalizeArtifact(architecture, artifactSource);
    catalog[architecture] = { ...normalized, publishedAt };
  }
  return catalog;
}

function persistCatalog(catalog: RuntimeCatalog) {
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
    process.env.CLIENT_RUNTIME_ARTIFACTS_PATH || path.join(__dirname, "../../config/client-runtime-artifacts.json"),
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

function isSafeImageReference(value: string) {
  return value.length >= 3 && value.length <= 255
    && /^[a-z0-9]+(?:[._/-][a-z0-9]+)*:[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/.test(value);
}

function sameArtifact(left: ClientRuntimeArtifact, right: Omit<ClientRuntimeArtifact, "publishedAt">) {
  return [
    "architecture",
    "version",
    "buildNumber",
    "objectKey",
    "filename",
    "sha256",
    "size",
    "sourceSha",
    "bffImage",
    "builderImage",
  ].every((key) => left[key as keyof ClientRuntimeArtifact] === right[key as keyof typeof right]);
}

function serviceError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function badRequest(message: string) { return serviceError(message, 400); }
function conflict(message: string) { return serviceError(message, 409); }
function serviceUnavailable(message: string) { return serviceError(message, 503); }
