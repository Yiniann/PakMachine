import { TemplateEntry } from "./uploadService";
import crypto from "crypto";
import { loadSettings } from "../controllers/systemSettingsController";

const githubHeaders = () => {
  const settings = loadSettings();
  const token = settings.actionDispatchToken || process.env.ACTION_DISPATCH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("缺少 ACTION_DISPATCH_TOKEN（或 GITHUB_TOKEN）配置");
  }
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "PacMachine",
    Accept: "application/vnd.github+json",
  };
};

export const dispatchGithubWorkflow = async (template: TemplateEntry, jobId: number, envContent: string) => {
  const settings = loadSettings();
  const workflowFile = settings.workflowFile || process.env.GITHUB_WORKFLOW_FILE || "build.yml";
  if (!template.repo) {
    throw new Error("模板缺少 repo 配置");
  }
  const [owner, repo] = template.repo.split("/");
  if (!owner || !repo) {
    throw new Error("repo 格式不正确，需形如 owner/repo");
  }
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
  const body = {
    ref: template.branch || "main",
    inputs: {
      jobId: String(jobId),
      envJson: envContent,
      workdir: template.workdir || "",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...githubHeaders() },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub dispatch 失败: ${res.status} ${text}`);
  }
};

export const verifyGithubWebhook = (rawBody: Buffer | undefined, signature: string | undefined) => {
  const settings = loadSettings();
  const webhookSecret = settings.actionWebhookSecret || process.env.ACTION_WEBHOOK_SECRET || process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  if (!rawBody || !signature) return false;
  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};
