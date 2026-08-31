const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const express = require("express");

const { registerClientBaseArtifact } = require("../src/controllers/clientControlController");
const { authenticateClientBaseRelease } = require("../src/middleware/clientBaseReleaseAuth");

const releaseToken = "test-release-token-that-is-at-least-32-bytes-long";
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "pakmachine-client-base-"));
const catalogPath = path.join(temporaryDirectory, "client-base-artifacts.json");
let server;
let baseUrl;

const artifact = (overrides = {}) => ({
  architecture: "arm64",
  version: "1.2.3",
  buildNumber: 200,
  objectKey: "client-base-artifacts/macos/v1.2.3/run-10-attempt-1/Shuttle-base-1.2.3-arm64.zip",
  filename: "Shuttle-base-1.2.3-arm64.zip",
  sha256: "a".repeat(64),
  size: 144_072_932,
  sourceSha: "b".repeat(40),
  ...overrides,
});

async function publish(body, token = releaseToken) {
  const headers = { "Content-Type": "application/json" };
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}/api/client-control/internal/base-artifacts/macos`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  return { response, payload: await response.json() };
}

before(async () => {
  process.env.CLIENT_BASE_ARTIFACTS_PATH = catalogPath;
  process.env.CLIENT_BASE_RELEASE_TOKEN = releaseToken;
  const app = express();
  app.use(express.json());
  app.put(
    "/api/client-control/internal/base-artifacts/:platform",
    authenticateClientBaseRelease,
    registerClientBaseArtifact,
  );
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  delete process.env.CLIENT_BASE_ARTIFACTS_PATH;
  delete process.env.CLIENT_BASE_RELEASE_TOKEN;
});

test("基础包发布接口拒绝缺失或错误的发布凭证", async () => {
  const missing = await publish(artifact(), null);
  assert.equal(missing.response.status, 401);
  assert.equal(missing.payload.error, "基础包发布凭证无效");

  const invalid = await publish(artifact(), "wrong-release-token-that-is-also-long-enough");
  assert.equal(invalid.response.status, 401);
  assert.equal(invalid.payload.error, "基础包发布凭证无效");
  assert.equal(fs.existsSync(catalogPath), false);
});

test("基础包发布接口登记合法产物并持久化目录", async () => {
  const result = await publish(artifact());
  assert.equal(result.response.status, 201);
  assert.equal(result.payload.artifact.platform, "macos");
  assert.equal(result.payload.artifact.buildNumber, 200);
  assert.match(result.payload.artifact.publishedAt, /^\d{4}-\d{2}-\d{2}T/);

  const stored = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  assert.deepEqual(stored.macos, result.payload.artifact);
});

test("基础包发布接口禁止构建号回退", async () => {
  const result = await publish(artifact({ buildNumber: 199 }));
  assert.equal(result.response.status, 409);
  assert.equal(result.payload.error, "macos 基础包构建号不能回退");
});

test("基础包发布接口拒绝越权的 R2 对象路径", async () => {
  const result = await publish(artifact({
    buildNumber: 201,
    objectKey: "client-base-artifacts/windows/v1.2.3/Shuttle-base-1.2.3-arm64.zip",
  }));
  assert.equal(result.response.status, 400);
  assert.equal(result.payload.error, "基础包对象路径不合法");
});
