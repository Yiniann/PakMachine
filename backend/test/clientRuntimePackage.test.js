const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");
const AdmZip = require("adm-zip");

const {
  createClientRuntimeDeploymentPackage,
  normalizeAdminPathPrefix,
} = require("../src/services/clientRuntimePackageService");

const runtimeArtifact = {
  architecture: "amd64",
  version: "1.2.3",
  buildNumber: 300,
  objectKey: "client-runtime-artifacts/amd64/v1.2.3/run-20/runtime.tar.gz",
  filename: "runtime.tar.gz",
  sha256: "a".repeat(64),
  size: 544_072_932,
  sourceSha: "b".repeat(40),
  bffImage: "shuttle-client-bff:1.2.3-300-amd64",
  builderImage: "shuttle-client-builder:1.2.3-300-amd64",
  publishedAt: new Date().toISOString(),
};

test("部署包只包含安装所需文件并使用同一份随机 Builder 密钥", () => {
  const deployment = createClientRuntimeDeploymentPackage({
    artifact: runtimeArtifact,
    runtimeDownloadUrl: "https://r2.example.com/runtime.tar.gz?X-Amz-Signature=test",
    runtimeDownloadExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    controlBaseUrl: "https://shuttleits.example.com",
    manifestPublicKeyBase64: "A".repeat(64),
    adminPathPrefix: "/client-center",
  });
  const zip = new AdmZip(deployment.buffer);
  assert.deepEqual(zip.getEntries().map((entry) => entry.entryName).sort(), [
    ".env",
    "README.txt",
    "compose.yaml",
    "install.sh",
  ]);
  const environment = zip.readAsText(".env");
  const bffSecret = /CLIENT_BUILDER_SHARED_SECRET="([A-Za-z0-9_-]+)"/.exec(environment)?.[1];
  const builderSecret = /BUILDER_SHARED_SECRET="([A-Za-z0-9_-]+)"/.exec(environment)?.[1];
  assert.equal(bffSecret, builderSecret);
  assert.equal(bffSecret.length, 64);
  assert.match(environment, /RUNTIME_ARCHIVE_URL="https:\/\/r2\.example\.com\//);
  assert.doesNotMatch(environment, /CLIENT_R2_|AWS_ACCESS_KEY|GITHUB_TOKEN/);

  const compose = zip.readAsText("compose.yaml");
  assert.match(compose, /127\.0\.0\.1:8787:8787/);
  assert.doesNotMatch(compose, /8790:8790/);
  const installer = zip.readAsText("install.sh");
  const syntax = spawnSync("bash", ["-n"], { input: installer, encoding: "utf8" });
  assert.equal(syntax.status, 0, syntax.stderr);
});

test("部署包拒绝保留管理路径和非 HTTPS 运行包地址", () => {
  assert.throws(() => normalizeAdminPathPrefix("/api"), /管理路径/);
  assert.throws(() => createClientRuntimeDeploymentPackage({
    artifact: runtimeArtifact,
    runtimeDownloadUrl: "http://r2.example.com/runtime.tar.gz?signature=test",
    runtimeDownloadExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    controlBaseUrl: "https://shuttleits.example.com",
    manifestPublicKeyBase64: "A".repeat(64),
    adminPathPrefix: "/admin",
  }), /HTTPS/);
});
