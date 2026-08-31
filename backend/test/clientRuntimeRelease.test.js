const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const express = require("express");

const { registerClientRuntimeArtifact } = require("../src/controllers/clientControlController");
const { authenticateClientBaseRelease } = require("../src/middleware/clientBaseReleaseAuth");

const releaseToken = "runtime-release-token-that-is-at-least-32-bytes-long";
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "pakmachine-client-runtime-"));
const catalogPath = path.join(temporaryDirectory, "client-runtime-artifacts.json");
let server;
let baseUrl;

const artifact = (overrides = {}) => ({
  version: "1.2.3",
  buildNumber: 300,
  objectKey: "client-runtime-artifacts/amd64/v1.2.3/run-20-attempt-1/shuttle-client-runtime-1.2.3-amd64.tar.gz",
  filename: "shuttle-client-runtime-1.2.3-amd64.tar.gz",
  sha256: "a".repeat(64),
  size: 544_072_932,
  sourceSha: "b".repeat(40),
  bffImage: "shuttle-client-bff:1.2.3-300-amd64",
  builderImage: "shuttle-client-builder:1.2.3-300-amd64",
  ...overrides,
});

async function publish(body, token = releaseToken) {
  const headers = { "Content-Type": "application/json" };
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}/api/client-control/internal/runtime-artifacts/amd64`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  return { response, payload: await response.json() };
}

before(async () => {
  process.env.CLIENT_RUNTIME_ARTIFACTS_PATH = catalogPath;
  process.env.CLIENT_BASE_RELEASE_TOKEN = releaseToken;
  const app = express();
  app.use(express.json());
  app.put(
    "/api/client-control/internal/runtime-artifacts/:architecture",
    authenticateClientBaseRelease,
    registerClientRuntimeArtifact,
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
  delete process.env.CLIENT_RUNTIME_ARTIFACTS_PATH;
  delete process.env.CLIENT_BASE_RELEASE_TOKEN;
});

test("运行包发布接口拒绝缺失或错误的发布凭证", async () => {
  assert.equal((await publish(artifact(), null)).response.status, 401);
  assert.equal((await publish(artifact(), "incorrect-runtime-release-token-with-32-bytes")).response.status, 401);
  assert.equal(fs.existsSync(catalogPath), false);
});

test("运行包发布接口登记合法产物并持久化目录", async () => {
  const result = await publish(artifact());
  assert.equal(result.response.status, 201);
  assert.equal(result.payload.artifact.architecture, "amd64");
  assert.equal(result.payload.artifact.buildNumber, 300);
  const stored = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  assert.deepEqual(stored.amd64, result.payload.artifact);
});

test("运行包发布接口禁止构建号回退", async () => {
  const result = await publish(artifact({ buildNumber: 299 }));
  assert.equal(result.response.status, 409);
  assert.equal(result.payload.error, "amd64 运行包构建号不能回退");
});

test("运行包发布接口拒绝越权对象路径和任意镜像名称", async () => {
  const objectPath = await publish(artifact({
    buildNumber: 301,
    objectKey: "client-runtime-artifacts/arm64/v1.2.3/runtime.tar.gz",
  }));
  assert.equal(objectPath.response.status, 400);
  assert.equal(objectPath.payload.error, "运行包对象路径不合法");

  const image = await publish(artifact({ buildNumber: 301, bffImage: "example/other:latest" }));
  assert.equal(image.response.status, 400);
  assert.equal(image.payload.error, "BFF 镜像名称不合法");
});
