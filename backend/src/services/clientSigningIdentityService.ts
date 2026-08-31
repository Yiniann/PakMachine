import crypto from "crypto";
import fs from "fs";
import path from "path";

const IDENTITY_VERSION = 1;
const identityPath = path.resolve(
  process.env.CLIENT_SIGNING_IDENTITY_PATH || path.join(__dirname, "../../config/client-signing-identity.json"),
);

export type ClientSigningIdentity = {
  version: number;
  algorithm: "Ed25519";
  keyId: string;
  privateKeyBase64: string;
  publicKeyBase64: string;
  createdAt: string;
};

export type ClientSigningPublicConfig = {
  configured: boolean;
  controlBaseUrl: string | null;
  keyId: string | null;
  publicKeyBase64: string | null;
  createdAt: string | null;
};

export const normalizeClientControlBaseUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) throw new Error("请填写 ShuttleITS 公网地址");
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("ShuttleITS 公网地址格式不正确");
  }
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
    || url.username || url.password || url.search || url.hash) {
    throw new Error("ShuttleITS 公网地址必须使用 HTTPS，且不能包含帐号、查询参数或片段");
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().replace(/\/$/, "");
};

export const getClientSigningIdentity = (): ClientSigningIdentity | null => {
  try {
    return parseIdentity(JSON.parse(fs.readFileSync(identityPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    throw new Error(`客户端构建签名身份无法读取：${(error as Error).message}`);
  }
};

export const initializeClientSigningIdentity = () => {
  const existing = getClientSigningIdentity();
  if (existing) return existing;
  return persistIdentity(createIdentityFromKeyPair());
};

export const requireClientManifestPrivateKey = () => {
  const identity = getClientSigningIdentity();
  if (identity) return importPrivateKey(identity.privateKeyBase64);
  throw serviceUnavailable("尚未在系统设置中生成客户端构建签名身份");
};

export const clientSigningPublicConfig = (controlBaseUrl: unknown): ClientSigningPublicConfig => {
  const identity = getClientSigningIdentity();
  let normalizedBaseUrl: string | null = null;
  if (typeof controlBaseUrl === "string" && controlBaseUrl.trim()) {
    normalizedBaseUrl = normalizeClientControlBaseUrl(controlBaseUrl);
  }
  return publicConfig(normalizedBaseUrl, identity);
};

export const clientBffBuildEnvironment = (controlBaseUrl: unknown) => {
  const config = clientSigningPublicConfig(controlBaseUrl);
  if (!config.controlBaseUrl || !config.publicKeyBase64) {
    throw serviceUnavailable("请先配置 ShuttleITS 公网地址并生成客户端构建签名身份");
  }
  return Object.freeze({
    SHUTTLEITS_CONTROL_BASE_URL: config.controlBaseUrl,
    SHUTTLEITS_MANIFEST_PUBLIC_KEY_BASE64: config.publicKeyBase64,
  });
};

function createIdentityFromKeyPair() {
  const { privateKey } = crypto.generateKeyPairSync("ed25519");
  return createIdentity(privateKey);
}

function createIdentity(privateKey: crypto.KeyObject): ClientSigningIdentity {
  const publicKey = crypto.createPublicKey(privateKey);
  return Object.freeze({
    version: IDENTITY_VERSION,
    algorithm: "Ed25519" as const,
    keyId: publicKeyId(publicKey),
    privateKeyBase64: privateKey.export({ format: "der", type: "pkcs8" }).toString("base64url"),
    publicKeyBase64: publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
    createdAt: new Date().toISOString(),
  });
}

function importPrivateKey(encoded: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error("客户端构建签名私钥格式不正确");
  try {
    const key = crypto.createPrivateKey({ key: Buffer.from(encoded, "base64url"), format: "der", type: "pkcs8" });
    if (key.asymmetricKeyType !== "ed25519") throw new Error();
    return key;
  } catch {
    throw new Error("客户端构建签名私钥不是有效的 Ed25519 私钥");
  }
}

function parseIdentity(value: unknown): ClientSigningIdentity {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("文件内容不正确");
  const source = value as Record<string, unknown>;
  if (source.version !== IDENTITY_VERSION || source.algorithm !== "Ed25519"
    || typeof source.keyId !== "string" || typeof source.privateKeyBase64 !== "string"
    || typeof source.publicKeyBase64 !== "string" || typeof source.createdAt !== "string") {
    throw new Error("文件字段不正确");
  }
  const privateKey = importPrivateKey(source.privateKeyBase64);
  const publicKey = crypto.createPublicKey(privateKey);
  const publicKeyBase64 = publicKey.export({ format: "der", type: "spki" }).toString("base64url");
  const keyId = publicKeyId(publicKey);
  if (source.publicKeyBase64 !== publicKeyBase64 || source.keyId !== keyId
    || !Number.isFinite(Date.parse(source.createdAt))) {
    throw new Error("公私钥不匹配");
  }
  return {
    version: IDENTITY_VERSION,
    algorithm: "Ed25519",
    keyId,
    privateKeyBase64: source.privateKeyBase64,
    publicKeyBase64,
    createdAt: source.createdAt,
  };
}

function persistIdentity(identity: ClientSigningIdentity) {
  const directory = path.dirname(identityPath);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = `${identityPath}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;
  let descriptor = fs.openSync(temporaryPath, "wx", 0o600);
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(identity, null, 2)}\n`, "utf8");
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  try {
    fs.linkSync(temporaryPath, identityPath);
    fs.chmodSync(identityPath, 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "EEXIST") {
      const existing = getClientSigningIdentity();
      if (existing) return existing;
    }
    throw error;
  } finally {
    try { fs.unlinkSync(temporaryPath); } catch {}
  }
  return identity;
}

function publicConfig(controlBaseUrl: string | null, identity: ClientSigningIdentity | null): ClientSigningPublicConfig {
  return Object.freeze({
    configured: Boolean(controlBaseUrl && identity),
    controlBaseUrl,
    keyId: identity?.keyId || null,
    publicKeyBase64: identity?.publicKeyBase64 || null,
    createdAt: identity?.createdAt || null,
  });
}

function publicKeyId(publicKey: crypto.KeyObject) {
  const der = publicKey.export({ format: "der", type: "spki" });
  return `ed25519-${crypto.createHash("sha256").update(der).digest("hex").slice(0, 24)}`;
}

function serviceUnavailable(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 503;
  return error;
}
