const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const {
  checkClientBaseReleaseToken,
  getClientBaseStorageCredentials,
  getClientBaseStoragePublicConfig,
  rotateClientBaseReleaseToken,
  saveClientBaseStorageConfig,
} = require("../src/services/clientBaseStorageConfigService");
const { createStoredClientArtifactDownloadUrl } = require("../src/services/clientR2Service");

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "pakmachine-client-storage-"));
const configPath = path.join(temporaryDirectory, "client-base-storage.json");
const keyPath = path.join(temporaryDirectory, "client-base-storage.key");
const environmentKeys = [
  "CLIENT_BASE_RELEASE_TOKEN",
  "CLIENT_R2_ACCOUNT_ID",
  "CLIENT_R2_ACCESS_KEY_ID",
  "CLIENT_R2_SECRET_ACCESS_KEY",
  "CLIENT_R2_BUCKET",
];
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

before(() => {
  process.env.CLIENT_BASE_STORAGE_CONFIG_PATH = configPath;
  process.env.CLIENT_BASE_STORAGE_KEY_PATH = keyPath;
  for (const key of environmentKeys) delete process.env[key];
});

after(() => {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  delete process.env.CLIENT_BASE_STORAGE_CONFIG_PATH;
  delete process.env.CLIENT_BASE_STORAGE_KEY_PATH;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("加密保存 R2 凭证且管理接口状态不返回密钥", () => {
  const accessKeyId = "access-key-id-for-client-base-storage";
  const secretAccessKey = "secret-access-key-for-client-base-storage-testing";
  const result = saveClientBaseStorageConfig({
    accountId: "a".repeat(32),
    bucket: "shuttle-client-base",
    accessKeyId,
    secretAccessKey,
  });

  assert.equal(result.configured, true);
  assert.equal(result.source, "settings");
  assert.equal(result.accountId, "a".repeat(32));
  assert.equal(result.bucket, "shuttle-client-base");
  assert.equal("accessKeyId" in result, false);
  assert.equal("secretAccessKey" in result, false);

  const stored = fs.readFileSync(configPath, "utf8");
  assert.equal(stored.includes(accessKeyId), false);
  assert.equal(stored.includes(secretAccessKey), false);
  assert.equal(fs.statSync(configPath).mode & 0o777, 0o600);
  assert.equal(fs.statSync(keyPath).mode & 0o777, 0o600);

  assert.deepEqual(getClientBaseStorageCredentials(), {
    accountId: "a".repeat(32),
    bucket: "shuttle-client-base",
    accessKeyId,
    secretAccessKey,
  });
});

test("留空凭证时保留原密钥并允许更新存储桶", () => {
  saveClientBaseStorageConfig({
    accountId: "b".repeat(32),
    bucket: "shuttle-client-base-next",
  });
  const credentials = getClientBaseStorageCredentials();
  assert.equal(credentials.accountId, "b".repeat(32));
  assert.equal(credentials.bucket, "shuttle-client-base-next");
  assert.equal(credentials.accessKeyId, "access-key-id-for-client-base-storage");
  assert.equal(credentials.secretAccessKey, "secret-access-key-for-client-base-storage-testing");
});

test("发布密钥只保存哈希且轮换后旧密钥立即失效", () => {
  const first = rotateClientBaseReleaseToken();
  assert.equal(first.token.length, 64);
  assert.deepEqual(checkClientBaseReleaseToken(first.token), { configured: true, valid: true });

  const stored = fs.readFileSync(configPath, "utf8");
  assert.equal(stored.includes(first.token), false);
  assert.equal(getClientBaseStoragePublicConfig().releaseTokenConfigured, true);

  const second = rotateClientBaseReleaseToken();
  assert.notEqual(second.token, first.token);
  assert.deepEqual(checkClientBaseReleaseToken(first.token), { configured: true, valid: false });
  assert.deepEqual(checkClientBaseReleaseToken(second.token), { configured: true, valid: true });
});

test("部署包下载使用系统设置中加密保存的 R2 凭证", async () => {
  const result = await createStoredClientArtifactDownloadUrl(
    "client-runtime-artifacts/amd64/v0.1.1/runtime.tar.gz",
    "runtime.tar.gz",
    "client-runtime-package",
  );

  const url = new URL(result.url);
  assert.equal(url.hostname, `shuttle-client-base-next.${"b".repeat(32)}.r2.cloudflarestorage.com`);
  assert.equal(url.pathname, "/client-runtime-artifacts/amd64/v0.1.1/runtime.tar.gz");
  assert.match(url.searchParams.get("X-Amz-Credential") || "", /^access-key-id-for-client-base-storage\//);
  assert.equal(url.searchParams.get("response-content-disposition"), "attachment; filename*=UTF-8''runtime.tar.gz");
});
