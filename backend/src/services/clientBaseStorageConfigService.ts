import crypto from "crypto";
import fs from "fs";
import path from "path";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

const DOCUMENT_VERSION = 1;
const SECRET_ALGORITHM = "aes-256-gcm";

type EncryptedSecret = {
  algorithm: typeof SECRET_ALGORITHM;
  iv: string;
  authTag: string;
  ciphertext: string;
};

type StoredClientBaseSettings = {
  version: typeof DOCUMENT_VERSION;
  storage?: {
    accountId: string;
    bucket: string;
    accessKeyId: EncryptedSecret;
    secretAccessKey: EncryptedSecret;
  };
  release?: {
    tokenHash: string;
    createdAt: string;
  };
  updatedAt: string;
};

export type ClientBaseStorageCredentials = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export type ClientBaseStoragePublicConfig = {
  configured: boolean;
  source: "settings" | "environment" | "none";
  accountId: string | null;
  bucket: string | null;
  credentialsConfigured: boolean;
  releaseTokenConfigured: boolean;
  releaseTokenSource: "settings" | "environment" | "none";
  releaseTokenCreatedAt: string | null;
  updatedAt: string | null;
};

export const getClientBaseStoragePublicConfig = (): ClientBaseStoragePublicConfig => {
  const document = loadDocument();
  const environment = loadEnvironmentCredentials(false);
  const storageSource = document.storage ? "settings" : environment ? "environment" : "none";
  const environmentReleaseConfigured = validReleaseToken(process.env.CLIENT_BASE_RELEASE_TOKEN);
  const releaseTokenSource = document.release
    ? "settings"
    : environmentReleaseConfigured ? "environment" : "none";
  return {
    configured: storageSource !== "none",
    source: storageSource,
    accountId: document.storage?.accountId || environment?.accountId || null,
    bucket: document.storage?.bucket || environment?.bucket || null,
    credentialsConfigured: storageSource !== "none",
    releaseTokenConfigured: releaseTokenSource !== "none",
    releaseTokenSource,
    releaseTokenCreatedAt: document.release?.createdAt || null,
    updatedAt: document.storage || document.release ? document.updatedAt : null,
  };
};

export const saveClientBaseStorageConfig = (input: unknown): ClientBaseStoragePublicConfig => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw badRequest("R2 配置不正确");
  const source = input as Record<string, unknown>;
  rejectUnknownKeys(source, ["accessKeyId", "accountId", "bucket", "secretAccessKey"]);
  const accountId = normalizeAccountId(source.accountId);
  const bucket = normalizeBucket(source.bucket);
  const accessKeyId = normalizeOptionalSecret(source.accessKeyId, "R2 Access Key ID");
  const secretAccessKey = normalizeOptionalSecret(source.secretAccessKey, "R2 Secret Access Key");
  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw badRequest("Access Key ID 和 Secret Access Key 必须同时填写");
  }

  const current = loadDocument();
  const currentStorage = current.storage;
  if (!accessKeyId && !currentStorage) throw badRequest("首次配置时必须填写完整的 R2 凭证");
  const storage = accessKeyId && secretAccessKey
    ? {
        accountId,
        bucket,
        accessKeyId: encryptSecret(accessKeyId, "access-key-id"),
        secretAccessKey: encryptSecret(secretAccessKey, "secret-access-key"),
      }
    : { ...currentStorage!, accountId, bucket };
  persistDocument({
    ...current,
    version: DOCUMENT_VERSION,
    storage,
    updatedAt: new Date().toISOString(),
  });
  return getClientBaseStoragePublicConfig();
};

export const getClientBaseStorageCredentials = (): ClientBaseStorageCredentials => {
  const document = loadDocument();
  if (document.storage) {
    return {
      accountId: document.storage.accountId,
      bucket: document.storage.bucket,
      accessKeyId: decryptSecret(document.storage.accessKeyId, "access-key-id"),
      secretAccessKey: decryptSecret(document.storage.secretAccessKey, "secret-access-key"),
    };
  }
  const environment = loadEnvironmentCredentials(true);
  if (environment) return environment;
  throw serviceUnavailable("尚未在系统设置中配置客户端基础包 R2 存储");
};

export const testClientBaseStorageConnection = async () => {
  const credentials = getClientBaseStorageCredentials();
  const client = createR2Client(credentials);
  try {
    await client.send(new HeadBucketCommand({ Bucket: credentials.bucket }));
  } catch {
    throw badRequest("无法访问该 R2 存储桶，请检查 Account ID、凭证、权限和存储桶名称");
  } finally {
    client.destroy();
  }
  return { ok: true as const, checkedAt: new Date().toISOString() };
};

export const rotateClientBaseReleaseToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const createdAt = new Date().toISOString();
  const current = loadDocument();
  persistDocument({
    ...current,
    version: DOCUMENT_VERSION,
    release: { tokenHash: hashReleaseToken(token), createdAt },
    updatedAt: createdAt,
  });
  return { token, createdAt, config: getClientBaseStoragePublicConfig() };
};

export const checkClientBaseReleaseToken = (supplied: string) => {
  const document = loadDocument();
  if (document.release) {
    const suppliedHash = hashReleaseToken(supplied);
    return {
      configured: true,
      valid: timingSafeEqualHex(document.release.tokenHash, suppliedHash),
    };
  }
  const expected = String(process.env.CLIENT_BASE_RELEASE_TOKEN || "");
  if (!validReleaseToken(expected)) return { configured: false, valid: false };
  return {
    configured: true,
    valid: timingSafeEqualText(expected, supplied),
  };
};

export const createClientBaseR2Client = (credentials = getClientBaseStorageCredentials()) =>
  createR2Client(credentials);

function createR2Client(credentials: ClientBaseStorageCredentials) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${credentials.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
}

function loadDocument(): StoredClientBaseSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(resolveConfigPath(), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyDocument();
    throw serviceUnavailable(`客户端基础包存储配置无法读取：${(error as Error).message}`);
  }
  try {
    return normalizeDocument(parsed);
  } catch (error) {
    if (Number((error as Error & { status?: number })?.status) === 400) {
      throw serviceUnavailable(`客户端基础包存储配置格式不正确：${(error as Error).message}`);
    }
    throw error;
  }
}

function normalizeDocument(value: unknown): StoredClientBaseSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw serviceUnavailable("客户端基础包存储配置格式不正确");
  const source = value as Record<string, unknown>;
  if (source.version !== DOCUMENT_VERSION || typeof source.updatedAt !== "string" || !Number.isFinite(Date.parse(source.updatedAt))) {
    throw serviceUnavailable("客户端基础包存储配置版本不正确");
  }
  const result: StoredClientBaseSettings = {
    version: DOCUMENT_VERSION,
    updatedAt: source.updatedAt,
  };
  if (source.storage !== undefined) {
    const storage = requireRecord(source.storage, "R2 存储配置");
    result.storage = {
      accountId: normalizeAccountId(storage.accountId),
      bucket: normalizeBucket(storage.bucket),
      accessKeyId: normalizeEncryptedSecret(storage.accessKeyId),
      secretAccessKey: normalizeEncryptedSecret(storage.secretAccessKey),
    };
  }
  if (source.release !== undefined) {
    const release = requireRecord(source.release, "发布密钥配置");
    const tokenHash = String(release.tokenHash || "");
    const createdAt = String(release.createdAt || "");
    if (!/^[0-9a-f]{64}$/.test(tokenHash) || !Number.isFinite(Date.parse(createdAt))) {
      throw serviceUnavailable("发布密钥配置格式不正确");
    }
    result.release = { tokenHash, createdAt };
  }
  return result;
}

function emptyDocument(): StoredClientBaseSettings {
  return { version: DOCUMENT_VERSION, updatedAt: new Date(0).toISOString() };
}

function persistDocument(document: StoredClientBaseSettings) {
  const target = resolveConfigPath();
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporary = `${target}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  fs.renameSync(temporary, target);
  fs.chmodSync(target, 0o600);
}

function encryptSecret(value: string, context: string): EncryptedSecret {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(SECRET_ALGORITHM, loadOrCreateMasterKey(), iv);
  cipher.setAAD(Buffer.from(`pakmachine:client-base-storage:${context}:v1`));
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    algorithm: SECRET_ALGORITHM,
    iv: iv.toString("base64url"),
    authTag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

function decryptSecret(value: EncryptedSecret, context: string) {
  try {
    const decipher = crypto.createDecipheriv(SECRET_ALGORITHM, loadOrCreateMasterKey(), Buffer.from(value.iv, "base64url"));
    decipher.setAAD(Buffer.from(`pakmachine:client-base-storage:${context}:v1`));
    decipher.setAuthTag(Buffer.from(value.authTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(value.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw serviceUnavailable("客户端基础包 R2 凭证无法解密，请检查服务器持久化密钥");
  }
}

function normalizeEncryptedSecret(value: unknown): EncryptedSecret {
  const source = requireRecord(value, "加密凭证");
  if (source.algorithm !== SECRET_ALGORITHM
    || !validBase64Url(source.iv, 16, 16)
    || !validBase64Url(source.authTag, 22, 22)
    || !validBase64Url(source.ciphertext, 1, 512)) {
    throw serviceUnavailable("加密凭证格式不正确");
  }
  return {
    algorithm: SECRET_ALGORITHM,
    iv: String(source.iv),
    authTag: String(source.authTag),
    ciphertext: String(source.ciphertext),
  };
}

function loadOrCreateMasterKey() {
  const target = resolveKeyPath();
  try {
    return parseMasterKey(fs.readFileSync(target, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw serviceUnavailable(`客户端基础包存储密钥无法读取：${(error as Error).message}`);
    }
  }
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const generated = crypto.randomBytes(32);
  try {
    fs.writeFileSync(target, `${generated.toString("base64url")}\n`, { mode: 0o600, flag: "wx" });
    return generated;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return parseMasterKey(fs.readFileSync(target, "utf8"));
    throw error;
  }
}

function parseMasterKey(value: string) {
  const encoded = value.trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(encoded)) throw serviceUnavailable("客户端基础包存储密钥格式不正确");
  const key = Buffer.from(encoded, "base64url");
  if (key.length !== 32) throw serviceUnavailable("客户端基础包存储密钥长度不正确");
  return key;
}

function loadEnvironmentCredentials(strict: boolean): ClientBaseStorageCredentials | null {
  const values = {
    accountId: String(process.env.CLIENT_R2_ACCOUNT_ID || "").trim(),
    accessKeyId: String(process.env.CLIENT_R2_ACCESS_KEY_ID || "").trim(),
    secretAccessKey: String(process.env.CLIENT_R2_SECRET_ACCESS_KEY || "").trim(),
    bucket: String(process.env.CLIENT_R2_BUCKET || "").trim(),
  };
  if (!Object.values(values).some(Boolean)) return null;
  if (!Object.values(values).every(Boolean)) {
    if (strict) throw serviceUnavailable("CLIENT_R2_* 环境变量配置不完整");
    return null;
  }
  try {
    return {
      accountId: normalizeAccountId(values.accountId),
      accessKeyId: normalizeRequiredSecret(values.accessKeyId, "R2 Access Key ID"),
      secretAccessKey: normalizeRequiredSecret(values.secretAccessKey, "R2 Secret Access Key"),
      bucket: normalizeBucket(values.bucket),
    };
  } catch (error) {
    if (strict) throw error;
    return null;
  }
}

function normalizeAccountId(value: unknown) {
  const result = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(result)) throw badRequest("Cloudflare Account ID 必须是 32 位十六进制字符");
  return result;
}

function normalizeBucket(value: unknown) {
  const result = String(value || "").trim();
  if (result.length < 3 || result.length > 63 || !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(result)
    || result.includes("..")) {
    throw badRequest("R2 存储桶名称格式不正确");
  }
  return result;
}

function normalizeOptionalSecret(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return "";
  return normalizeRequiredSecret(value, label);
}

function normalizeRequiredSecret(value: unknown, label: string) {
  const result = String(value || "").trim();
  if (result.length < 16 || result.length > 256 || /[\u0000-\u001f\u007f]/.test(result)) {
    throw badRequest(`${label} 格式不正确`);
  }
  return result;
}

function requireRecord(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw serviceUnavailable(`${label}格式不正确`);
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(source: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(source).some((key) => !allowed.includes(key))) throw badRequest("R2 配置包含不支持的字段");
}

function validBase64Url(value: unknown, minimum: number, maximum: number) {
  return typeof value === "string" && value.length >= minimum && value.length <= maximum && /^[A-Za-z0-9_-]+$/.test(value);
}

function validReleaseToken(value: unknown) {
  const token = String(value || "");
  return Buffer.byteLength(token, "utf8") >= 32 && Buffer.byteLength(token, "utf8") <= 256 && !/[\r\n]/.test(token);
}

function hashReleaseToken(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function timingSafeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function resolveConfigPath() {
  return path.resolve(process.env.CLIENT_BASE_STORAGE_CONFIG_PATH
    || path.join(__dirname, "../../config/client-base-storage.json"));
}

function resolveKeyPath() {
  return path.resolve(process.env.CLIENT_BASE_STORAGE_KEY_PATH
    || path.join(__dirname, "../../config/client-base-storage.key"));
}

function serviceError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function badRequest(message: string) { return serviceError(message, 400); }
function serviceUnavailable(message: string) { return serviceError(message, 503); }
