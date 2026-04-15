import { TemplateEntry } from "./uploadService";
import crypto from "crypto";
import { loadSettings } from "../controllers/systemSettingsController";

type DispatchPayload = {
  buildMode: "legacy" | "bff";
  frontendEnvContent: string;
  serverEnvContent?: string;
  runtimeSettings?: Record<string, unknown> | null;
};

const RETRIABLE_FETCH_ERROR_CODES = new Set([
  "EAI_AGAIN",
  "ENOTFOUND",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ECONNREFUSED",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableFetchError = (error: unknown) => {
  if (!(error instanceof TypeError)) return false;
  if (!/fetch failed/i.test(error.message)) return false;
  const cause = (error as any).cause;
  const code = typeof cause?.code === "string" ? cause.code : "";
  return RETRIABLE_FETCH_ERROR_CODES.has(code) || code === "";
};

const normalizeFetchError = (error: unknown, context: string) => {
  const cause = (error as any)?.cause;
  const code = typeof cause?.code === "string" ? ` (${cause.code})` : "";
  const message = cause?.hostname ? `${cause.hostname}${code}` : `${cause?.message || "fetch failed"}${code}`;
  return new Error(`${context}: 无法连接 GitHub API，${message}。请检查 DNS、网络连通性或代理配置后重试。`);
};

const fetchWithRetry = async (url: string, init: RequestInit, context: string, retries = 2) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (!isRetriableFetchError(error) || attempt === retries) {
        throw normalizeFetchError(error, context);
      }
      await sleep(300 * (attempt + 1));
    }
  }

  throw normalizeFetchError(lastError, context);
};

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

const parseRepo = (repo: string) => {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("repo 格式不正确，需形如 owner/repo");
  }
  return { owner, name };
};

const formatDispatchError = (status: number, text: string, repo: string, workflowFile: string, branch: string) => {
  if (status === 404) {
    return `GitHub dispatch 失败: 404 ${text}（repo=${repo}, workflow=${workflowFile}, branch=${branch}；请检查仓库名是否正确、目标仓库的 .github/workflows/${workflowFile} 是否存在，以及 ACTION_DISPATCH_TOKEN 是否有该仓库访问权限）`;
  }
  if (status === 403) {
    return `GitHub dispatch 失败: 403 ${text}（repo=${repo}, workflow=${workflowFile}, branch=${branch}；请检查 ACTION_DISPATCH_TOKEN 是否具备 repo/workflow 权限，并确认目标仓库允许 Actions 运行）`;
  }
  if (status === 422) {
    return `GitHub dispatch 失败: 422 ${text}（repo=${repo}, workflow=${workflowFile}, branch=${branch}；请检查 workflow_dispatch.inputs 与后端发送的 inputs 是否一致）`;
  }
  return `GitHub dispatch 失败: ${status} ${text}（repo=${repo}, workflow=${workflowFile}, branch=${branch}）`;
};

const candidateWorkflowFiles = (workflowFile: string) => {
  const normalized = workflowFile.trim();
  if (normalized === "package.yml") return ["package.yml", "build.yml"];
  if (normalized === "build.yml") return ["build.yml", "package.yml"];
  return [normalized];
};

export const dispatchGithubWorkflow = async (template: TemplateEntry, jobId: number, payload: DispatchPayload) => {
  const settings = loadSettings();
  const workflowFile = (settings.workflowFile || process.env.GITHUB_WORKFLOW_FILE || "package.yml").trim();
  if (!template.repo) {
    throw new Error("模板缺少 repo 配置");
  }
  const branch = template.branch || "main";
  const { owner, name } = parseRepo(template.repo);

  const legacyBody = {
    ref: branch,
    inputs: {
      mode: payload.buildMode,
      job_id: String(jobId),
      frontend_env: payload.frontendEnvContent,
      server_env: payload.buildMode === "bff" ? payload.serverEnvContent || "" : "",
      runtime_settings: payload.buildMode === "legacy" ? JSON.stringify(payload.runtimeSettings ?? null) : "",
    },
  };

  const currentBody = {
    ref: branch,
    inputs: {
      jobId: String(jobId),
      envJson:
        payload.buildMode === "bff"
          ? JSON.stringify(
              {
                buildMode: payload.buildMode,
                frontendEnv: payload.frontendEnvContent,
                serverEnv: payload.serverEnvContent || "",
                runtimeSettings: payload.runtimeSettings ?? null,
              },
              null,
              2,
            )
          : payload.frontendEnvContent,
      workdir: template.workdir || "",
    },
  };

  let lastError = "";
  let lastStatus = 0;
  for (const workflowCandidate of candidateWorkflowFiles(workflowFile)) {
    const url = `https://api.github.com/repos/${owner}/${name}/actions/workflows/${workflowCandidate}/dispatches`;
    const body = workflowCandidate === "package.yml" ? legacyBody : currentBody;
    const res = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...githubHeaders() },
        body: JSON.stringify(body),
      },
      `GitHub dispatch 失败（repo=${template.repo}, workflow=${workflowCandidate}, branch=${branch}）`,
    );

    if (res.ok) {
      return;
    }

    const text = await res.text();
    lastStatus = res.status;
    lastError = formatDispatchError(res.status, text, template.repo, workflowCandidate, branch);
    if (lastStatus !== 404) {
      break;
    }
  }

  throw new Error(lastError);
};

export const deleteGithubRunArtifacts = async (repo: string, runId: number | string) => {
  const { owner, name } = parseRepo(repo);
  const perPage = 100;
  let page = 1;
  let deleted = 0;

  while (true) {
    const listUrl = `https://api.github.com/repos/${owner}/${name}/actions/runs/${runId}/artifacts?per_page=${perPage}&page=${page}`;
    const listRes = await fetchWithRetry(
      listUrl,
      { headers: githubHeaders() },
      `获取 GitHub artifacts 失败（repo=${repo}, runId=${runId}）`,
    );
    if (!listRes.ok) {
      const text = await listRes.text();
      throw new Error(`获取 GitHub artifacts 失败: ${listRes.status} ${text}`);
    }
    const data = (await listRes.json()) as { artifacts?: Array<{ id: number }>; total_count?: number };
    const artifacts = Array.isArray(data.artifacts) ? data.artifacts : [];
    if (artifacts.length === 0) {
      break;
    }

    for (const artifact of artifacts) {
      const deleteUrl = `https://api.github.com/repos/${owner}/${name}/actions/artifacts/${artifact.id}`;
      const delRes = await fetchWithRetry(
        deleteUrl,
        { method: "DELETE", headers: githubHeaders() },
        `删除 GitHub artifact 失败（repo=${repo}, artifactId=${artifact.id}）`,
      );
      if (!delRes.ok && delRes.status !== 204) {
        const text = await delRes.text();
        throw new Error(`删除 GitHub artifact 失败: ${delRes.status} ${text}`);
      }
      deleted += 1;
    }

    if (artifacts.length < perPage) {
      break;
    }
    page += 1;
  }

  return deleted;
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
