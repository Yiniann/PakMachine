export type ClientBuildReportStatus = "pending" | "running" | "success" | "failed";

export type ClientBuildReport = {
  status: ClientBuildReportStatus;
  progress: number;
  message: string;
  artifact: null | {
    filename: string;
    size: number;
    sha256: string;
  };
};

const STATUSES = new Set<ClientBuildReportStatus>(["pending", "running", "success", "failed"]);
const TERMINAL_STATUSES = new Set(["success", "failed"]);

export const normalizeClientBuildReport = (input: unknown): ClientBuildReport => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("构建状态格式不正确");
  const source = input as Record<string, unknown>;
  if (Object.keys(source).some((key) => !["status", "progress", "message", "artifact"].includes(key))) {
    throw new Error("构建状态包含不支持的字段");
  }
  const status = String(source.status || "") as ClientBuildReportStatus;
  if (!STATUSES.has(status)) throw new Error("构建状态不合法");
  const progress = Number(source.progress);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) throw new Error("构建进度必须是 0 到 100 的整数");
  if (TERMINAL_STATUSES.has(status) && progress !== 100) throw new Error("已结束的构建进度必须是 100");
  const message = typeof source.message === "string" ? source.message.trim() : "";
  if (!message || message.length > 500 || message.includes("\0")) throw new Error("构建消息需要填写 1 到 500 个字符");

  let artifact: ClientBuildReport["artifact"] = null;
  if (status === "success") artifact = normalizeArtifact(source.artifact);
  else if (source.artifact !== undefined && source.artifact !== null) throw new Error("未成功的构建不能携带产物信息");
  return { status, progress, message, artifact };
};

export const assertClientBuildTransition = (currentStatus: string, currentProgress: number, report: ClientBuildReport) => {
  if (TERMINAL_STATUSES.has(currentStatus)) {
    if (report.status !== currentStatus) throw new Error("已结束的构建状态不能再次修改");
    return;
  }
  if (currentStatus !== "issued" && !STATUSES.has(currentStatus as ClientBuildReportStatus)) {
    throw new Error("当前构建状态不合法");
  }
  if (report.progress < currentProgress) throw new Error("构建进度不能回退");
  if (currentStatus === "running" && report.status === "pending") throw new Error("构建状态不能回退到等待中");
};

function normalizeArtifact(input: unknown): NonNullable<ClientBuildReport["artifact"]> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("构建成功时必须携带产物信息");
  const source = input as Record<string, unknown>;
  if (Object.keys(source).sort().join(",") !== "filename,sha256,size") throw new Error("产物信息格式不正确");
  const filename = typeof source.filename === "string" ? source.filename.trim() : "";
  if (!filename || filename.length > 255 || filename !== filename.split(/[\\/]/).pop() || /[\u0000-\u001f]/.test(filename)) {
    throw new Error("产物文件名不合法");
  }
  const size = Number(source.size);
  if (!Number.isSafeInteger(size) || size < 1 || size > 2 * 1024 ** 4) throw new Error("产物大小不合法");
  const sha256 = typeof source.sha256 === "string" ? source.sha256.toLowerCase() : "";
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error("产物 SHA-256 不合法");
  return { filename, size, sha256 };
}
