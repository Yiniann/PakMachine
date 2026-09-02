const assert = require("node:assert/strict");
const test = require("node:test");

const {
  assertClientBuildTransition,
  normalizeClientBuildReport,
} = require("../src/services/clientBuildReportService");

test("accepts Builder progress and successful artifact metadata", () => {
  const running = normalizeClientBuildReport({
    status: "running",
    progress: 68,
    message: "正在构建客户端",
  });
  assert.deepEqual(running, {
    status: "running",
    progress: 68,
    message: "正在构建客户端",
    artifact: null,
  });
  assert.doesNotThrow(() => assertClientBuildTransition("pending", 0, running));

  const success = normalizeClientBuildReport({
    status: "success",
    progress: 100,
    message: "构建完成",
    artifact: {
      filename: "Customer-1.2.3-android.apk",
      size: 123456789,
      sha256: "A".repeat(64),
    },
  });
  assert.equal(success.artifact.sha256, "a".repeat(64));
  assert.doesNotThrow(() => assertClientBuildTransition("running", 68, success));
});

test("rejects invalid artifacts and build-state regressions", () => {
  assert.throws(() => normalizeClientBuildReport({
    status: "success",
    progress: 100,
    message: "构建完成",
  }), /必须携带产物信息/);
  assert.throws(() => normalizeClientBuildReport({
    status: "running",
    progress: 50,
    message: "构建中",
    artifact: { filename: "app.zip", size: 1, sha256: "a".repeat(64) },
  }), /不能携带产物信息/);
  assert.throws(() => assertClientBuildTransition("running", 80, {
    status: "running",
    progress: 60,
    message: "构建中",
    artifact: null,
  }), /进度不能回退/);
  assert.throws(() => assertClientBuildTransition("success", 100, {
    status: "failed",
    progress: 100,
    message: "失败",
    artifact: null,
  }), /不能再次修改/);
});
