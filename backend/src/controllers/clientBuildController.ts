import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import prisma from "../lib/prisma";
import { dispatchClientGithubWorkflow } from "../services/githubWorkflowService";
import { createClientArtifactDownloadUrl } from "../services/clientR2Service";
import { getClientGithubTemplate } from "../services/uploadService";

const CLIENT_PLATFORMS = new Set(["macos", "windows", "android"] as const);
const CLIENT_ENV_KEY_LIST = [
  "VITE_SHUTTLE_API_MODE",
  "VITE_SHUTTLE_CONFIG_ID",
  "VITE_SHUTTLE_PANEL_BASE_URL",
  "VITE_SHUTTLE_GATEWAY_BASE_URL",
  "VITE_SHUTTLE_GATEWAY_BASE_URLS",
  "VITE_SHUTTLE_WEBSITE_URL",
  "VITE_SHUTTLE_SUPPORT_API_URL",
  "VITE_SHUTTLE_APP_NAME",
  "VITE_SHUTTLE_APP_ID",
  "VITE_SHUTTLE_APP_VERSION",
  "VITE_SHUTTLE_APP_BUILD_NUMBER",
  "VITE_SHUTTLE_PUBLISHER",
  "VITE_SHUTTLE_APP_ICON",
] as const;
const CLIENT_SYSTEM_ENV_KEYS = new Set([
  "VITE_SHUTTLE_API_MODE",
  "VITE_SHUTTLE_CONFIG_ID",
  "VITE_SHUTTLE_PANEL_BASE_URL",
  "VITE_SHUTTLE_GATEWAY_BASE_URL",
  "VITE_SHUTTLE_GATEWAY_BASE_URLS",
  "VITE_SHUTTLE_WEBSITE_URL",
  "VITE_SHUTTLE_APP_NAME",
  "VITE_SHUTTLE_APP_ID",
  "VITE_SHUTTLE_APP_VERSION",
  "VITE_SHUTTLE_APP_BUILD_NUMBER",
  "VITE_SHUTTLE_PUBLISHER",
  "VITE_SHUTTLE_SUPPORT_API_URL",
]);
const CLIENT_INPUT_ENV_KEYS = new Set<string>(
  CLIENT_ENV_KEY_LIST.filter((key) => !CLIENT_SYSTEM_ENV_KEYS.has(key)),
);
const REQUIRED_CLIENT_ENV_KEYS = [
  "VITE_SHUTTLE_APP_ICON",
];
const DOWNLOAD_WINDOW_MS = 60_000;
const DOWNLOAD_LIMIT = 5;
const downloadAttempts = new Map<string, number[]>();

type ClientPlatform = "macos" | "windows" | "android";
type ClientArchitecture = "arm64" | "x64" | "universal";

const parseOptionalSiteId = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("siteId 不合法");
  return parsed;
};

const parseClientEnvironment = (content: unknown) => {
  if (typeof content !== "string" || !content.trim()) throw new Error("缺少 clientEnvContent");
  if (Buffer.byteLength(content, "utf8") > 32 * 1024) throw new Error("clientEnvContent 不能超过 32 KB");
  const values: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) throw new Error("clientEnvContent 格式不正确");
    const key = line.slice(0, separator).trim();
    if (!CLIENT_INPUT_ENV_KEYS.has(key)) throw new Error(`clientEnvContent 包含系统字段或非法字段: ${key}`);
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  const missing = REQUIRED_CLIENT_ENV_KEYS.filter((key) => !values[key]);
  if (missing.length) throw new Error(`clientEnvContent 缺少字段: ${missing.join(", ")}`);

  for (const key of ["VITE_SHUTTLE_SUPPORT_API_URL", "VITE_SHUTTLE_APP_ICON"]) {
    const value = values[key];
    if (value && !/^https:\/\//i.test(value)) throw new Error(`${key} 必须使用 HTTPS 地址`);
  }
  return values;
};

const serializeClientEnvironment = (values: Record<string, string>) =>
  CLIENT_ENV_KEY_LIST
    .filter((key) => values[key] !== undefined)
    .map((key) => `${key}=${JSON.stringify(values[key])}`)
    .join("\n");

const getOrCreateClientIdentity = async (
  userId: number,
  siteId: number | null,
  brandName: string,
) => {
  const brandKey = siteId ? `site:${siteId}` : "legacy";
  let existing = await prisma.clientAppConfig.findUnique({
    where: { userId_brandKey: { userId, brandKey } },
  });

  // Preserve an identity created before a legacy brand was migrated into UserSite.
  if (!existing && siteId) {
    const legacy = await prisma.clientAppConfig.findUnique({
      where: { userId_brandKey: { userId, brandKey: "legacy" } },
    });
    if (legacy && legacy.brandNameSnapshot === brandName) {
      existing = await prisma.clientAppConfig.update({
        where: { id: legacy.id },
        data: { siteId, brandKey, brandNameSnapshot: brandName },
      });
    }
  }

  if (existing) {
    if (existing.brandNameSnapshot !== brandName || existing.siteId !== siteId) {
      return prisma.clientAppConfig.update({
        where: { id: existing.id },
        data: { siteId, brandNameSnapshot: brandName },
      });
    }
    return existing;
  }

  return prisma.clientAppConfig.create({
    data: {
      userId,
      siteId,
      brandKey,
      brandNameSnapshot: brandName,
      appId: `com.shuttle.client.c${randomUUID().replace(/-/g, "")}`,
    },
  });
};

const resolveTarget = (platformValue: unknown, architectureValue: unknown) => {
  const platform = String(platformValue || "") as ClientPlatform;
  if (!CLIENT_PLATFORMS.has(platform)) throw new Error("platform 必须是 macos、windows 或 android");
  const requested = String(architectureValue || "");
  if (platform === "macos") {
    if (requested && requested !== "arm64") throw new Error("macOS Intel 构建暂未开放");
    return { platform, architecture: "arm64" as const };
  }
  if (platform === "windows" && requested && requested !== "x64") throw new Error("Windows 仅支持 x64");
  if (platform === "android" && requested && requested !== "universal") throw new Error("Android 仅支持 universal");
  return { platform, architecture: platform === "windows" ? "x64" as const : "universal" as const };
};

const consumeDownloadAllowance = (userId: number, jobId: number, remoteAddress: string) => {
  const now = Date.now();
  const key = `${userId}:${jobId}:${remoteAddress}`;
  const recent = (downloadAttempts.get(key) || []).filter((time) => now - time < DOWNLOAD_WINDOW_MS);
  if (recent.length >= DOWNLOAD_LIMIT) return false;
  recent.push(now);
  downloadAttempts.set(key, recent);
  if (downloadAttempts.size > 2_000) {
    for (const [entryKey, attempts] of downloadAttempts) {
      if (!attempts.some((time) => now - time < DOWNLOAD_WINDOW_MS)) downloadAttempts.delete(entryKey);
    }
  }
  return true;
};

export const createClientBuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    let target: ReturnType<typeof resolveTarget>;
    let env: Record<string, string>;
    let requestedSiteId: number | null;
    try {
      target = resolveTarget(req.body?.platform, req.body?.architecture);
      env = parseClientEnvironment(req.body?.clientEnvContent);
      requestedSiteId = parseOptionalSiteId(req.body?.siteId);
      if (!requestedSiteId) throw new Error("请选择已开通客户端构建的品牌");
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sites: requestedSiteId
          ? {
              where: { id: requestedSiteId },
              select: {
                id: true,
                name: true,
                clientBuildEnabled: true,
                frontendOrigins: {
                  orderBy: { createdAt: "asc" },
                  include: { frontendOrigin: { select: { origin: true } } },
                },
              },
            }
          : {
              select: {
                id: true,
                name: true,
                clientBuildEnabled: true,
                frontendOrigins: {
                  orderBy: { createdAt: "asc" },
                  include: { frontendOrigin: { select: { origin: true } } },
                },
              },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            },
      },
    });
    if (!dbUser) return res.status(404).json({ error: "User not found" });
    const selectedSite = dbUser.sites[0] ?? null;
    if (requestedSiteId && !selectedSite) return res.status(404).json({ error: "品牌不存在" });
    if (!selectedSite?.clientBuildEnabled) {
      return res.status(403).json({ error: "该品牌尚未开通客户端构建权限" });
    }
    const gatewayBaseUrls = selectedSite.frontendOrigins
      .map((item) => item.frontendOrigin.origin)
      .filter((origin, index, origins) => origin.startsWith("https://") && origins.indexOf(origin) === index);
    if (gatewayBaseUrls.length === 0) {
      return res.status(400).json({ error: "该品牌没有可用于客户端 Gateway 的 HTTPS 前端域名" });
    }
    const effectiveSiteId = selectedSite?.id ?? null;
    const effectiveBrandName = (selectedSite?.name || dbUser.siteName || "").trim();
    if (!effectiveBrandName) return res.status(400).json({ error: "请先设置品牌名字" });
    if (effectiveBrandName.length > 40 || /[\\/:*?"<>|\u0000-\u001f]/.test(effectiveBrandName)) {
      return res.status(400).json({ error: "品牌名字不能超过 40 个字符，且不能包含文件名特殊字符" });
    }
    const clientIdentity = await getOrCreateClientIdentity(userId, effectiveSiteId, effectiveBrandName);
    const clientTemplate = getClientGithubTemplate();
    if (!clientTemplate || clientTemplate.type !== "github" || !clientTemplate.repo) {
      return res.status(503).json({ error: "管理员尚未在模板管理中配置客户端模板" });
    }

    const enforcedEnv: Record<string, string> = {
      ...env,
      VITE_SHUTTLE_API_MODE: "gateway",
      VITE_SHUTTLE_PANEL_BASE_URL: "",
      VITE_SHUTTLE_GATEWAY_BASE_URL: gatewayBaseUrls[0],
      VITE_SHUTTLE_GATEWAY_BASE_URLS: JSON.stringify(gatewayBaseUrls),
      VITE_SHUTTLE_WEBSITE_URL: gatewayBaseUrls[0],
      VITE_SHUTTLE_APP_NAME: effectiveBrandName,
      VITE_SHUTTLE_APP_ID: clientIdentity.appId,
      VITE_SHUTTLE_CONFIG_ID: clientIdentity.appId,
      VITE_SHUTTLE_PUBLISHER: effectiveBrandName,
      VITE_SHUTTLE_SUPPORT_API_URL: "",
    };
    const enforcedClientEnvContent = serializeClientEnvironment(enforcedEnv);

    const snapshot = JSON.stringify({
      buildKind: "client",
      platform: target.platform,
      architecture: target.architecture,
      clientEnv: enforcedClientEnvContent,
    }, null, 2);
    const job = await prisma.buildJob.create({
      data: {
        userId,
        siteId: effectiveSiteId,
        siteNameSnapshot: effectiveBrandName,
        buildKind: "client",
        platform: target.platform,
        arch: target.architecture,
        filename: effectiveBrandName,
        envJson: snapshot,
        status: "queued",
        message: "已提交客户端构建任务",
      },
    });

    try {
      await dispatchClientGithubWorkflow(clientTemplate, job.id, {
        platform: target.platform,
        clientEnvContent: enforcedClientEnvContent,
      });
      await prisma.buildJob.update({ where: { id: job.id }, data: { status: "running", message: "GitHub Actions 处理中..." } });
      return res.json({ jobId: job.id, status: "running" });
    } catch (error) {
      await prisma.buildJob.update({ where: { id: job.id }, data: { status: "failed", message: (error as Error).message } });
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const listClientBuilds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [jobs, manifests, sites] = await Promise.all([
      prisma.buildJob.findMany({
        where: { userId, buildKind: "client" },
        orderBy: { id: "desc" },
        take: 20,
      }),
      prisma.clientBuildManifest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.userSite.findMany({ where: { userId }, select: { id: true, name: true } }),
    ]);
    const siteNames = new Map(sites.map((site) => [site.id, site.name]));
    const legacyRecords = jobs.map((job) => ({
      id: job.id,
      source: "legacy" as const,
      status: job.status,
      progress: ["success", "failed"].includes(job.status) ? 100 : null,
      message: job.message,
      platform: job.platform,
      arch: job.arch,
      version: job.version,
      appName: job.filename,
      artifactFilename: job.artifactFilename,
      size: job.artifactSize,
      sha256: job.artifactSha256,
      createdAt: job.createdAt,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      expiresAt: job.expiresAt,
      downloadable: job.status === "success" && Boolean(job.objectKey) && (!job.expiresAt || job.expiresAt > new Date()),
    }));
    const managedRecords = manifests.map((build) => {
      const manifest = parseIssuedClientManifest(build.envelopeJson);
      return {
        id: build.id,
        source: "customer-builder" as const,
        status: build.status === "issued" ? "queued" : build.status,
        progress: build.progress,
        message: build.message || (build.status === "issued" ? "等待客户中台开始构建" : null),
        platform: build.platform,
        arch: manifest.architecture,
        version: manifest.clientVersion,
        appName: manifest.appName || siteNames.get(build.siteId) || "客户端",
        artifactFilename: build.artifactFilename,
        size: build.artifactSize === null ? null : Number(build.artifactSize),
        sha256: build.artifactSha256,
        createdAt: build.createdAt,
        startedAt: build.startedAt,
        completedAt: build.completedAt,
        durationMs: build.startedAt && build.completedAt
          ? Math.max(0, build.completedAt.getTime() - build.startedAt.getTime())
          : null,
        expiresAt: null,
        downloadable: false,
      };
    });
    return res.json([...legacyRecords, ...managedRecords]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 20));
  } catch (error) {
    next(error);
  }
};

function parseIssuedClientManifest(envelopeJson: string) {
  try {
    const manifest = JSON.parse(envelopeJson)?.manifest;
    return {
      architecture: typeof manifest?.architecture === "string" ? manifest.architecture : null,
      clientVersion: typeof manifest?.clientVersion === "string" ? manifest.clientVersion : null,
      appName: typeof manifest?.app?.name === "string" ? manifest.app.name : null,
    };
  } catch {
    return { architecture: null, clientVersion: null, appName: null };
  }
}

export const createClientDownload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId) || jobId < 1) return res.status(400).json({ error: "Invalid id" });
    const job = await prisma.buildJob.findUnique({ where: { id: jobId } });
    if (!job || job.buildKind !== "client") return res.status(404).json({ error: "客户端产物不存在" });
    if (job.userId !== userId) return res.status(403).json({ error: "无权下载" });
    if (job.status !== "success" || !job.objectKey || !job.artifactFilename) return res.status(409).json({ error: "客户端产物尚未生成" });
    if (job.expiresAt && job.expiresAt <= new Date()) return res.status(410).json({ error: "客户端产物已过期，请重新构建" });
    const remoteAddress = req.socket.remoteAddress || "unknown";
    if (!consumeDownloadAllowance(userId, jobId, remoteAddress)) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ error: "下载请求过于频繁，请稍后再试" });
    }
    const signed = await createClientArtifactDownloadUrl(job.objectKey, job.artifactFilename);
    res.setHeader("Cache-Control", "no-store");
    res.json({ url: signed.url, expiresAt: signed.expiresAt });
  } catch (error) {
    next(error);
  }
};
