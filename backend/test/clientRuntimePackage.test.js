const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createClientRuntimeDeploymentPackage,
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

test("部署接口返回完整运行包地址和对应的安装命令", () => {
  const deployment = createClientRuntimeDeploymentPackage({
    artifact: runtimeArtifact,
    runtimeDownloadUrl: "https://r2.example.com/runtime.tar.gz?X-Amz-Signature=test",
    runtimeDownloadExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  assert.equal(deployment.filename, "runtime.tar.gz");
  assert.match(deployment.downloadUrl, /^https:\/\/r2\.example\.com\//);
  assert.equal(deployment.installCommand, "sudo ./install.sh");
  assert.equal(deployment.architecture, "amd64");
  assert.equal(deployment.size, runtimeArtifact.size);
  assert.equal(deployment.sha256, runtimeArtifact.sha256);
});

test("部署包拒绝非 HTTPS 运行包地址", () => {
  assert.throws(() => createClientRuntimeDeploymentPackage({
    artifact: runtimeArtifact,
    runtimeDownloadUrl: "http://r2.example.com/runtime.tar.gz?signature=test",
    runtimeDownloadExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  }), /HTTPS/);
});
