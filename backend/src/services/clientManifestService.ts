import crypto from "crypto";
import { ClientBaseArtifact } from "./clientBaseArtifactService";
import { requireClientManifestPrivateKey } from "./clientSigningIdentityService";

export type ClientManifestPlatform = "macos" | "windows" | "android";

const ARCHITECTURES: Record<ClientManifestPlatform, string> = {
  macos: "arm64",
  windows: "x64",
  android: "universal",
};

export const normalizeGatewayBaseUrls = (input: unknown) => {
  if (!Array.isArray(input)) throw new Error("gatewayBaseUrls 必须是地址数组");
  const values = input.map((entry) => normalizeHttpsUrl(entry, "客户端连接地址"));
  const unique = values.filter((value, index) => values.indexOf(value) === index);
  if (unique.length < 1 || unique.length > 16) throw new Error("请填写 1 到 16 个不重复的客户端连接地址");
  return unique;
};

export const createSignedClientManifest = (input: {
  buildId: string;
  customerId: string;
  brandId: string;
  configId: string;
  platform: ClientManifestPlatform;
  appName: string;
  appId: string;
  publisher: string;
  iconUrl: string | null;
  iconSha256: string | null;
  gatewayBaseUrls: string[];
  bootstrapPublicProfileBase64: string;
  features?: string[];
  artifact: ClientBaseArtifact;
  issuedAt: number;
  expiresAt: number;
}) => {
  const privateKey = requireClientManifestPrivateKey();
  const publicKey = crypto.createPublicKey(privateKey);
  const keyId = publicKeyId(publicKey);
  const manifest = {
    protocolVersion: 1,
    buildId: input.buildId,
    customerId: input.customerId,
    brandId: input.brandId,
    configId: input.configId,
    platform: input.platform,
    architecture: ARCHITECTURES[input.platform],
    clientVersion: input.artifact.version,
    buildNumber: input.artifact.buildNumber,
    app: {
      name: input.appName,
      id: input.appId,
      publisher: input.publisher,
      iconUrl: input.iconUrl,
      iconSha256: input.iconSha256,
    },
    connection: {
      gatewayBaseUrls: input.gatewayBaseUrls,
      bootstrapPublicProfileBase64: input.bootstrapPublicProfileBase64,
    },
    features: [...new Set(input.features || ["client.core", "client.store"])].sort(),
    baseArtifact: {
      version: input.artifact.version,
      sha256: input.artifact.sha256,
      size: input.artifact.size,
    },
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };
  const signature = crypto.sign(null, Buffer.from(canonicalJson(manifest)), privateKey).toString("base64url");
  const envelope = { protocolVersion: 1, algorithm: "Ed25519", keyId, manifest, signature };
  return {
    envelope,
    manifestHash: crypto.createHash("sha256").update(canonicalJson(envelope)).digest("hex"),
  };
};

export const fetchHttpsSha256 = async (value: string, maximumBytes = 10 * 1024 * 1024) => {
  const url = normalizeHttpsUrl(value, "应用图标地址");
  const response = await fetch(url, { headers: { Accept: "image/png,image/*;q=0.8" }, redirect: "follow" });
  if (!response.ok || !response.body) throw new Error(`无法下载应用图标（HTTP ${response.status}）`);
  if (new URL(response.url).protocol !== "https:") throw new Error("应用图标跳转后必须保持 HTTPS");
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maximumBytes) throw new Error("应用图标不能超过 10 MB");
  const reader = response.body.getReader();
  const hash = crypto.createHash("sha256");
  let size = 0;
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    size += chunk.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      throw new Error("应用图标不能超过 10 MB");
    }
    hash.update(chunk);
  }
  if (size < 1) throw new Error("应用图标内容为空");
  return { url, sha256: hash.digest("hex"), size };
};

export const normalizeManifestPublicKey = (value: unknown) => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("instancePublicKey 不合法");
  try {
    const key = crypto.createPublicKey({ key: Buffer.from(value, "base64url"), format: "der", type: "spki" });
    if (key.asymmetricKeyType !== "ed25519") throw new Error();
    return key.export({ format: "der", type: "spki" }).toString("base64url");
  } catch {
    throw new Error("instancePublicKey 必须是 Ed25519 SPKI Base64URL 公钥");
  }
};

export const normalizeBootstrapPublicProfile = (value: unknown) => {
  if (typeof value !== "string" || value.length < 40 || value.length > 8192 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("bootstrapPublicProfileBase64 不合法");
  }
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || typeof parsed.publicKey !== "string") throw new Error();
  } catch {
    throw new Error("bootstrapPublicProfileBase64 不是有效的客户端公开配置");
  }
  return value;
};

export const hashSecret = (value: string) => crypto.createHash("sha256").update(value, "utf8").digest("hex");

function publicKeyId(publicKey: crypto.KeyObject) {
  const der = publicKey.export({ format: "der", type: "spki" });
  return `ed25519-${crypto.createHash("sha256").update(der).digest("hex").slice(0, 24)}`;
}

function normalizeHttpsUrl(value: unknown, label: string) {
  if (typeof value !== "string") throw new Error(`${label}必须是 HTTPS 地址`);
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${label}格式不正确`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error(`${label}必须使用 HTTPS，且不能包含帐号、查询参数或片段`);
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().replace(/\/$/, "");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Manifest 包含非法数字");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  throw new Error("Manifest 包含不可签名的数据");
}
