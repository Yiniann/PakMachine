import { Request, Response, NextFunction } from "express";
import {
  createGithubTemplate,
  deleteGithubTemplate,
  getTemplateEntry,
  listGithubTemplates,
} from "../services/uploadService";
import { dispatchGithubWorkflow } from "../services/githubWorkflowService";
import prisma from "../lib/prisma";
import type { Prisma, BuildArtifact, BuildJob } from "@prisma/client";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { URL } from "url";
import { normalizeArtifactUrl } from "../lib/artifactUrl";
import {
  canBuildBff,
  canBuildSpa,
  getDailyBuildLimit,
  normalizeUserType,
  shouldValidateFrontendOrigins,
} from "../lib/userAccess";

const ADMIN_BUILD_JOBS_LIMIT = 200;
const ALLOWED_ENV_KEYS = new Set([
  "VITE_API_MODE",
  "VITE_SITE_NAME",
  "VITE_BACKEND_TYPE",
  "VITE_ENABLE_LANDING",
  "VITE_ENABLE_TICKET",
  "VITE_ENABLE_VANTA",
  "VITE_SITE_LOGO",
  "VITE_LANDING_HERO_IMAGE",
  "VITE_AUTH_BACKGROUND",
  "VITE_ENABLE_IDHUB",
  "VITE_IDHUB_API_URL",
  "VITE_IDHUB_API_KEY",
  "VITE_PROD_API_URL",
  "VITE_ALLOWED_CLIENT_ORIGINS",
  "VITE_ENABLE_PRIORITY_MODE",
  "VITE_THIRD_PARTY_SCRIPTS",
  "VITE_ENABLE_DOWNLOAD",
  "VITE_DOWNLOAD_IOS",
  "VITE_DOWNLOAD_ANDROID",
  "VITE_DOWNLOAD_WINDOWS",
  "VITE_DOWNLOAD_MACOS",
  "VITE_DOWNLOAD_HARMONY",
]);

const ALLOWED_SERVER_ENV_KEYS = new Set([
  "PANEL_BASE_URL",
  "ADMIN_BASE_PATH",
  "IDHUB_BASE_URL",
  "IDHUB_AUTH_TOKEN",
  "ADMIN_ALLOWLIST_EMAILS",
  "VITE_ENABLE_PRIORITY_MODE",
]);

const RUNTIME_PANEL_TYPES = new Set(["xboard", "v2board", "xiaov2board"]);
const RUNTIME_TOP_LEVEL_KEYS = new Set([
  "panelType",
  "landingEnabled",
  "downloadEnabled",
  "ticketTodoEnabled",
  "vantaEnabled",
  "authBackground",
  "thirdPartySupportEnabled",
  "supportScript",
  "appleAutoProShareEnabled",
  "appleAutoProApiBaseUrl",
  "appleAutoProApiKey",
  "downloadLinks",
]);
const RUNTIME_DOWNLOAD_KEYS = new Set(["ios", "android", "windows", "macos", "harmony"]);
const parseFrontendOrigins = (value: unknown): string[] => {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
};

const validateEnvContent = (content: string) => {
  const lines = (content || "").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.trim().startsWith("#")) continue;
    const normalized = line.endsWith("\r") ? line.slice(0, -1) : line;
    if (normalized.includes("\r")) {
      return "字段中不允许包含换行";
    }
    const eq = normalized.indexOf("=");
    if (eq <= 0) {
      return "envContent 格式不正确";
    }
    const key = normalized.slice(0, eq).trim();
    if (!ALLOWED_ENV_KEYS.has(key)) {
      return "envContent 包含非法字段";
    }
  }
  return null;
};

const normalizeRuntimeString = (value: unknown, field: string) => {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new Error(`${field} 必须为字符串`);
  }
  return value.trim();
};

const normalizeRuntimeBoolean = (value: unknown, field: string, fallback: boolean) => {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") {
    throw new Error(`${field} 必须为布尔值`);
  }
  return value;
};

const normalizeUrl = (value: unknown, field: string, required = false) => {
  if (value === undefined || value === null) {
    if (required) throw new Error(`${field} 不能为空`);
    return "";
  }
  if (typeof value !== "string") {
    throw new Error(`${field} 必须为字符串`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new Error(`${field} 不能为空`);
    return "";
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`${field} 必须以 http:// 或 https:// 开头`);
  }
  return trimmed;
};

const normalizeUrlOrPath = (value: unknown, field: string) => {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new Error(`${field} 必须为字符串`);
  }
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  throw new Error(`${field} 必须以 http://、https:// 或 / 开头`);
};

const validateServerEnvContent = (content?: string | null) => {
  const normalizedContent = (content || "").trim();
  if (!normalizedContent) return null;

  const lines = normalizedContent.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.trim().startsWith("#")) continue;
    const normalized = line.endsWith("\r") ? line.slice(0, -1) : line;
    if (normalized.includes("\r")) {
      return "后端环境变量中不允许包含换行";
    }
    const eq = normalized.indexOf("=");
    if (eq <= 0) {
      return "serverEnvContent 格式不正确";
    }
    const key = normalized.slice(0, eq).trim();
    const value = normalized.slice(eq + 1).trim();
    if (!ALLOWED_SERVER_ENV_KEYS.has(key)) {
      return "serverEnvContent 包含非法字段";
    }
    if ((key === "PANEL_BASE_URL" || key === "IDHUB_BASE_URL") && value && !/^https?:\/\//i.test(value)) {
      return `${key} 必须以 http:// 或 https:// 开头`;
    }
  }

  return null;
};

const sanitizeRuntimeSettings = (input: unknown) => {
  if (input === undefined || input === null) return null;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("runtimeSettings 格式不正确");
  }

  const source = input as Record<string, unknown>;
  const unknownKey = Object.keys(source).find((key) => !RUNTIME_TOP_LEVEL_KEYS.has(key));
  if (unknownKey) {
    throw new Error(`runtimeSettings 包含非法字段: ${unknownKey}`);
  }

  const panelType = normalizeRuntimeString(source.panelType, "runtimeSettings.panelType");
  if (!RUNTIME_PANEL_TYPES.has(panelType)) {
    throw new Error("runtimeSettings.panelType 不合法");
  }

  const downloadLinksSource =
    source.downloadLinks && typeof source.downloadLinks === "object" && !Array.isArray(source.downloadLinks)
      ? (source.downloadLinks as Record<string, unknown>)
      : {};
  const unknownDownloadKey = Object.keys(downloadLinksSource).find((key) => !RUNTIME_DOWNLOAD_KEYS.has(key));
  if (unknownDownloadKey) {
    throw new Error(`runtimeSettings.downloadLinks 包含非法字段: ${unknownDownloadKey}`);
  }

  const thirdPartySupportEnabled = normalizeRuntimeBoolean(source.thirdPartySupportEnabled, "runtimeSettings.thirdPartySupportEnabled", false);
  const appleAutoProShareEnabled = normalizeRuntimeBoolean(source.appleAutoProShareEnabled, "runtimeSettings.appleAutoProShareEnabled", false);
  const supportScript = normalizeRuntimeString(source.supportScript, "runtimeSettings.supportScript");
  const appleAutoProApiKey = normalizeRuntimeString(source.appleAutoProApiKey, "runtimeSettings.appleAutoProApiKey");

  if (thirdPartySupportEnabled && !supportScript) {
    throw new Error("runtimeSettings.supportScript 不能为空");
  }
  if (appleAutoProShareEnabled && !appleAutoProApiKey) {
    throw new Error("runtimeSettings.appleAutoProApiKey 不能为空");
  }

  return {
    panelType,
    landingEnabled: normalizeRuntimeBoolean(source.landingEnabled, "runtimeSettings.landingEnabled", true),
    downloadEnabled: normalizeRuntimeBoolean(source.downloadEnabled, "runtimeSettings.downloadEnabled", false),
    ticketTodoEnabled: normalizeRuntimeBoolean(source.ticketTodoEnabled, "runtimeSettings.ticketTodoEnabled", true),
    vantaEnabled: normalizeRuntimeBoolean(source.vantaEnabled, "runtimeSettings.vantaEnabled", true),
    authBackground: normalizeUrlOrPath(source.authBackground, "runtimeSettings.authBackground"),
    thirdPartySupportEnabled,
    supportScript,
    appleAutoProShareEnabled,
    appleAutoProApiBaseUrl: normalizeUrl(source.appleAutoProApiBaseUrl, "runtimeSettings.appleAutoProApiBaseUrl", appleAutoProShareEnabled),
    appleAutoProApiKey,
    downloadLinks: {
      ios: normalizeUrlOrPath(downloadLinksSource.ios, "runtimeSettings.downloadLinks.ios"),
      android: normalizeUrlOrPath(downloadLinksSource.android, "runtimeSettings.downloadLinks.android"),
      windows: normalizeUrlOrPath(downloadLinksSource.windows, "runtimeSettings.downloadLinks.windows"),
      macos: normalizeUrlOrPath(downloadLinksSource.macos, "runtimeSettings.downloadLinks.macos"),
      harmony: normalizeUrlOrPath(downloadLinksSource.harmony, "runtimeSettings.downloadLinks.harmony"),
    },
  };
};

const normalizeEnvLines = (content: string, overrides: Record<string, string | null | undefined>) => {
  const lines = (content || "").split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return true;
    const key = trimmed.slice(0, eq).trim();
    return overrides[key] === undefined;
  });

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    const safeValue = value ?? "";
    filtered.push(`${key}=${safeValue}`);
  }
  return filtered.join("\n");
};

const parseOptionalSiteId = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw Object.assign(new Error("siteId 不合法"), { statusCode: 400 });
  }
  return parsed;
};

const extractSiteScopedConfig = (config: unknown, siteId: number | null) => {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  if (siteId === null) return config;
  const source = config as Record<string, unknown>;
  const siteConfigs = source.siteConfigs;
  if (!siteConfigs || typeof siteConfigs !== "object" || Array.isArray(siteConfigs)) return null;
  return (siteConfigs as Record<string, unknown>)[String(siteId)] ?? null;
};

const mergeSiteScopedConfig = (config: unknown, siteId: number | null, nextConfig: unknown) => {
  if (siteId === null) return nextConfig;
  const source = config && typeof config === "object" && !Array.isArray(config) ? (config as Record<string, unknown>) : {};
  const siteConfigs =
    source.siteConfigs && typeof source.siteConfigs === "object" && !Array.isArray(source.siteConfigs)
      ? { ...(source.siteConfigs as Record<string, unknown>) }
      : {};
  siteConfigs[String(siteId)] = nextConfig;
  return {
    version: 2,
    selectedSiteId: siteId,
    siteConfigs,
  };
};

const toPrismaJsonValue = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

export const listUploadedTemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = listGithubTemplates().map((item) => ({
      filename: item.name,
      description: item.description,
      modifiedAt: item.createdAt || undefined,
    }));
    const simplified = templates.map(({ filename, description, modifiedAt }) => ({ filename, description, modifiedAt }));
    res.json(simplified);
  } catch (err) {
    next(err);
  }
};

export const listGithubTemplateEntries = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = listGithubTemplates();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createGithubTemplateEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, repo, branch, workdir, description } = req.body ?? {};
    if (!name || !repo) {
      return res.status(400).json({ error: "缺少 name 或 repo" });
    }
    createGithubTemplate({ name, repo, branch, workdir, description });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const removeGithubTemplateEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: "缺少 name" });
    }
    deleteGithubTemplate(name);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const buildTemplatePackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, buildMode: rawBuildMode, frontendEnvContent, envContent, serverEnvContent, runtimeSettings, siteId: rawSiteId } = req.body ?? {};
    const buildMode = rawBuildMode === "bff" ? "bff" : "legacy";
    const requestedSiteId = parseOptionalSiteId(rawSiteId);
    const finalFrontendEnvContent = typeof frontendEnvContent === "string" && frontendEnvContent.trim()
      ? frontendEnvContent
      : typeof envContent === "string"
        ? envContent
        : "";

    if (!filename || !finalFrontendEnvContent) {
      return res.status(400).json({ error: "缺少 filename 或 frontendEnvContent" });
    }
    const envError = validateEnvContent(finalFrontendEnvContent);
    if (envError) {
      return res.status(400).json({ error: envError });
    }

    const serverEnvError = validateServerEnvContent(serverEnvContent);
    if (serverEnvError) {
      return res.status(400).json({ error: serverEnvError });
    }

    let sanitizedRuntimeSettings: Record<string, unknown> | null = null;
    try {
      sanitizedRuntimeSettings = sanitizeRuntimeSettings(runtimeSettings);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || "runtimeSettings 校验失败" });
    }

    const template = getTemplateEntry(filename);
    if (!template) {
      return res.status(404).json({ error: "版本不存在" });
    }

    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (template.type !== "github") {
      return res.status(400).json({ error: "当前版本仅支持 GitHub 构建" });
    }

    const dbUser: any = await prisma.user.findUnique({
      where: { id: Number(user.sub) },
      include: {
        sites: requestedSiteId
          ? { where: { id: requestedSiteId }, select: { id: true, name: true } }
          : { select: { id: true, name: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
    });
    const frontendOrigins = parseFrontendOrigins(dbUser?.frontendOriginsJson);
    const normalizedUserType = normalizeUserType(dbUser?.userType);
    const selectedSite = dbUser?.sites?.[0] ?? null;
    const effectiveSiteName = selectedSite?.name ?? dbUser?.siteName ?? null;
    const effectiveSiteId = selectedSite?.id ?? null;
    if (requestedSiteId && !selectedSite) {
      return res.status(404).json({ error: "站点不存在" });
    }
    const requiresFrontendOrigins = shouldValidateFrontendOrigins(dbUser?.role, normalizedUserType);
    if (requiresFrontendOrigins && frontendOrigins.length === 0) {
      return res.status(400).json({ error: "请先在首页绑定至少一个前端域名" });
    }
    const frontendOriginsValue = frontendOrigins.join(",");
    const enforcedFrontendEnv = normalizeEnvLines(finalFrontendEnvContent ?? "", {
      VITE_SITE_NAME: effectiveSiteName,
      VITE_ALLOWED_CLIENT_ORIGINS: frontendOriginsValue,
      VITE_API_MODE: buildMode,
    });
    const normalizedServerEnv = (serverEnvContent || "").trim();
    const snapshot = JSON.stringify(
      {
        buildMode,
        frontendEnv: enforcedFrontendEnv,
        serverEnv: normalizedServerEnv || null,
        runtimeSettings: sanitizedRuntimeSettings,
      },
      null,
      2,
    );

    const job = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const txUser: any = await tx.user.findUnique({
        where: { id: Number(user.sub) },
      });
      if (!txUser) {
        throw new Error("User not found");
      }
      const isAdmin = txUser.role === "admin";
      const normalizedUserType = normalizeUserType(txUser.userType);

      if (!canBuildSpa(txUser.role, normalizedUserType)) {
        throw Object.assign(new Error("当前账号为待开通状态，请联系管理员开通构建权限"), { statusCode: 403 });
      }
      if (buildMode === "bff" && !canBuildBff(txUser.role, normalizedUserType)) {
        throw Object.assign(new Error("当前账号仅支持 SPA 构建，升级到订阅版或优先版后可使用 Pro 构建"), { statusCode: 403 });
      }

      if (!isAdmin) {
        const limit = getDailyBuildLimit(txUser.role, normalizedUserType);
        const now = new Date();
        const isSameDay = txUser.buildQuotaDate && new Date(txUser.buildQuotaDate).toDateString() === now.toDateString();
        const used = isSameDay ? txUser.buildQuotaUsed || 0 : 0;
        if (used >= limit) {
          throw Object.assign(new Error(`今日构建次数已用完（每日最多 ${limit} 次）`), { statusCode: 429, quotaLeft: 0, quotaUsed: used, quotaLimit: limit });
        }

        await tx.user.update({
          where: { id: Number(user.sub) },
          data: { buildQuotaUsed: used + 1, buildQuotaDate: now } as any,
        });
      }

      return tx.buildJob.create({
        data: {
          userId: Number(user.sub),
          siteId: effectiveSiteId,
          siteNameSnapshot: effectiveSiteName,
          filename,
          envJson: snapshot,
          status: template.type === "github" ? "queued" : "pending",
          message: template.type === "github" ? "已提交到 GitHub Actions" : null,
        },
      });
    });

    try {
      await dispatchGithubWorkflow(template, job.id, {
        buildMode,
        frontendEnvContent: enforcedFrontendEnv,
        serverEnvContent: normalizedServerEnv,
        runtimeSettings: sanitizedRuntimeSettings,
      });
      await prisma.buildJob.update({
        where: { id: job.id },
        data: { status: "running", message: "GitHub Actions 处理中..." },
      });
      return res.json({ message: "已提交到 GitHub Actions", jobId: job.id, type: template.type, buildMode });
    } catch (err: any) {
      await prisma.buildJob.update({
        where: { id: job.id },
        data: { status: "failed", message: err?.message || "GitHub Actions 触发失败" },
      });
      throw err;
    }
  } catch (err) {
    if ((err as any)?.statusCode === 400) {
      return res.status(400).json({ error: (err as Error).message });
    }
    if ((err as any)?.statusCode === 403) {
      return res.status(403).json({ error: (err as Error).message });
    }
    if ((err as any)?.statusCode === 429) {
      return res.status(429).json({
        error: (err as Error).message,
        quotaLeft: (err as any).quotaLeft ?? 0,
        quotaUsed: (err as any).quotaUsed ?? 0,
        quotaLimit: (err as any).quotaLimit ?? 0,
      });
    }
    next(err);
  }
};

export const getBuildProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const siteId = parseOptionalSiteId(req.query.siteId);
    if (siteId !== null) {
      const site = await prisma.userSite.findFirst({
        where: { id: siteId, userId: Number(user.sub) },
        select: { id: true },
      });
      if (!site) {
        return res.status(404).json({ error: "站点不存在" });
      }
    }
    const profile = await prisma.buildProfile.findUnique({ where: { userId: Number(user.sub) } });
    res.json(extractSiteScopedConfig(profile?.config ?? null, siteId));
  } catch (err) {
    if ((err as any)?.statusCode === 400) {
      return res.status(400).json({ error: (err as Error).message });
    }
    next(err);
  }
};

export const saveBuildProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { config, siteId: rawSiteId } = req.body ?? {};
    const siteId = parseOptionalSiteId(rawSiteId);
    if (config === undefined) {
      return res.status(400).json({ error: "缺少 config" });
    }
    if (siteId !== null) {
      const site = await prisma.userSite.findFirst({
        where: { id: siteId, userId: Number(user.sub) },
        select: { id: true },
      });
      if (!site) {
        return res.status(404).json({ error: "站点不存在" });
      }
    }
    const existing = await prisma.buildProfile.findUnique({ where: { userId: Number(user.sub) } });
    const nextConfig = toPrismaJsonValue(mergeSiteScopedConfig(existing?.config ?? null, siteId, config));
    const saved = await prisma.buildProfile.upsert({
      where: { userId: Number(user.sub) },
      update: { config: nextConfig },
      create: { userId: Number(user.sub), config: nextConfig },
    });
    res.json(extractSiteScopedConfig(saved.config, siteId));
  } catch (err) {
    if ((err as any)?.statusCode === 400) {
      return res.status(400).json({ error: (err as Error).message });
    }
    next(err);
  }
};

export const downloadBuildArtifact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const artifact = await prisma.buildArtifact.findUnique({ where: { id } });
    if (!artifact) {
      return res.status(404).json({ error: "文件不存在" });
    }
    if (artifact.userId !== Number(user.sub)) {
      return res.status(403).json({ error: "无权下载" });
    }

    const remoteUrl = normalizeArtifactUrl(artifact.outputPath);
    const isRemote = remoteUrl ? /^https?:\/\//i.test(remoteUrl) : false;
    if (isRemote && remoteUrl) {
      const remote = await fetch(remoteUrl);
      if (!remote.ok || !remote.body) {
        return res.status(404).json({ error: "远程文件不可用" });
      }

      let filename = artifact.sourceFilename;
      if (!filename) {
        try {
          const u = new URL(remoteUrl);
          filename = path.basename(u.pathname);
        } catch {
          // fallback to stored sourceFilename
        }
      }

      res.setHeader("Content-Type", remote.headers.get("content-type") || "application/octet-stream");
      const len = remote.headers.get("content-length");
      if (len) {
        res.setHeader("Content-Length", len);
      }
      const dispositionName = encodeURIComponent(filename || "download");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${dispositionName}`);

      return Readable.fromWeb(remote.body as any).pipe(res);
    }

    if (!fs.existsSync(artifact.outputPath)) {
      return res.status(404).json({ error: "文件已不存在" });
    }
    return res.download(artifact.outputPath, artifact.sourceFilename || path.basename(artifact.outputPath));
  } catch (err) {
    next(err);
  }
};

export const buildTemplateJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const job = await prisma.buildJob.findUnique({ where: { id } });
    if (!job || job.userId !== Number(user.sub)) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({
      id: job.id,
      status: job.status,
      message: job.message,
      artifactId: job.artifactId,
      siteId: (job as any).siteId ?? null,
      siteName: (job as any).siteNameSnapshot ?? null,
      filename: job.filename,
      createdAt: job.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

export const listUserArtifacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const artifacts = await prisma.buildArtifact.findMany({
      where: { userId: Number(user.sub) },
      orderBy: { id: "desc" },
      take: 2,
    });
    const data = artifacts.map((a: BuildArtifact) => ({
      id: a.id,
      sourceFilename: a.sourceFilename,
      createdAt: a.createdAt,
    }));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const listUserBuildJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const limit = Number(req.query.limit) || 10;
    const jobs = await prisma.buildJob.findMany({
      where: { userId: Number(user.sub) },
      orderBy: { id: "desc" },
      take: Math.min(limit, 20),
    });

    res.json(
      jobs.map((j: BuildJob) => ({
        id: j.id,
        status: j.status,
        message: j.message,
        artifactId: j.artifactId,
        siteId: (j as any).siteId ?? null,
        siteName: (j as any).siteNameSnapshot ?? null,
        filename: j.filename,
        createdAt: j.createdAt,
      })),
    );
  } catch (err) {
    next(err);
  }
};

export const listAllBuildJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, ADMIN_BUILD_JOBS_LIMIT);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const jobs = await prisma.buildJob.findMany({
      include: { user: { select: { id: true, email: true, siteName: true } } },
      orderBy: { id: "desc" },
      take: limit,
      skip: offset,
    });
    res.json(
      jobs.map((j) => ({
        id: j.id,
        status: j.status,
        message: j.message,
        artifactId: j.artifactId,
        filename: j.filename,
        envJson: j.envJson,
        createdAt: j.createdAt,
        user: {
          id: j.user.id,
          email: j.user.email,
          siteName: (j as any).siteNameSnapshot ?? j.user.siteName,
        },
      })),
    );
  } catch (err) {
    next(err);
  }
};
