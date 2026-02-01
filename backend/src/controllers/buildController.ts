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

const ADMIN_BUILD_JOBS_LIMIT = 200;
const ALLOWED_ENV_KEYS = new Set([
  "VITE_SITE_NAME",
  "VITE_BACKEND_TYPE",
  "VITE_ENABLE_LANDING",
  "VITE_SITE_LOGO",
  "VITE_AUTH_BACKGROUND",
  "VITE_ENABLE_IDHUB",
  "VITE_IDHUB_API_URL",
  "VITE_IDHUB_API_KEY",
  "VITE_PROD_API_URL",
  "VITE_ALLOWED_CLIENT_ORIGINS",
  "VITE_ENABLE_DOWNLOAD",
  "VITE_DOWNLOAD_IOS",
  "VITE_DOWNLOAD_ANDROID",
  "VITE_DOWNLOAD_WINDOWS",
  "VITE_DOWNLOAD_MACOS",
  "VITE_DOWNLOAD_HARMONY",
]);

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
    const { filename, envContent } = req.body ?? {};
    if (!filename || !envContent) {
      return res.status(400).json({ error: "缺少 filename 或 envContent" });
    }
    const envError = validateEnvContent(envContent);
    if (envError) {
      return res.status(400).json({ error: envError });
    }
    const template = getTemplateEntry(filename);
    if (!template) {
      return res.status(404).json({ error: "模板不存在" });
    }

    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (template.type !== "github") {
      return res.status(400).json({ error: "仅支持 GitHub 构建模板" });
    }

    const dbUser: any = await prisma.user.findUnique({ where: { id: Number(user.sub) }, select: { siteName: true } });
    const enforcedEnv = normalizeEnvLines(envContent ?? "", {
      VITE_SITE_NAME: dbUser?.siteName ?? null,
    });

    const job = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const txUser: any = await tx.user.findUnique({
        where: { id: Number(user.sub) },
      });
      if (!txUser) {
        throw new Error("User not found");
      }
      const isAdmin = txUser.role === "admin";

      if (!isAdmin) {
        const now = new Date();
        const isSameDay = txUser.buildQuotaDate && new Date(txUser.buildQuotaDate).toDateString() === now.toDateString();
        const used = isSameDay ? txUser.buildQuotaUsed || 0 : 0;
        if (used >= 2) {
          throw Object.assign(new Error("今日构建次数已用完（每日最多 2 次）"), { statusCode: 429, quotaLeft: 0, quotaUsed: used });
        }

        await tx.user.update({
          where: { id: Number(user.sub) },
          data: { buildQuotaUsed: used + 1, buildQuotaDate: now } as any,
        });
      }

      return tx.buildJob.create({
        data: {
          userId: Number(user.sub),
          filename,
          envJson: enforcedEnv,
          status: template.type === "github" ? "queued" : "pending",
          message: template.type === "github" ? "已提交到 GitHub Actions" : null,
        },
      });
    });

    try {
      await dispatchGithubWorkflow(template, job.id, enforcedEnv);
      await prisma.buildJob.update({
        where: { id: job.id },
        data: { status: "running", message: "GitHub Actions 处理中..." },
      });
      return res.json({ message: "已提交到 GitHub Actions", jobId: job.id, type: template.type });
    } catch (err: any) {
      await prisma.buildJob.update({
        where: { id: job.id },
        data: { status: "failed", message: err?.message || "GitHub Actions 触发失败" },
      });
      throw err;
    }
  } catch (err) {
    // surfacing custom quota error
    if ((err as any)?.statusCode === 429) {
      return res.status(429).json({
        error: (err as Error).message,
        quotaLeft: (err as any).quotaLeft ?? 0,
        quotaUsed: (err as any).quotaUsed ?? 2,
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
    const profile = await prisma.buildProfile.findUnique({ where: { userId: Number(user.sub) } });
    res.json(profile?.config ?? null);
  } catch (err) {
    next(err);
  }
};

export const saveBuildProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { config } = req.body ?? {};
    if (config === undefined) {
      return res.status(400).json({ error: "缺少 config" });
    }
    const saved = await prisma.buildProfile.upsert({
      where: { userId: Number(user.sub) },
      update: { config },
      create: { userId: Number(user.sub), config },
    });
    res.json(saved.config);
  } catch (err) {
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
        createdAt: j.createdAt,
        user: {
          id: j.user.id,
          email: j.user.email,
          siteName: j.user.siteName,
        },
      })),
    );
  } catch (err) {
    next(err);
  }
};
