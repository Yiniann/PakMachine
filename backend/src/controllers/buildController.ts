import { Request, Response, NextFunction } from "express";
import {
  createGithubTemplate,
  deleteGithubTemplate,
  deleteTemplate,
  getTemplateEntry,
  handleTemplateUpload,
  listGithubTemplates,
  listTemplates,
  renameTemplate,
} from "../services/uploadService";
import { dispatchGithubWorkflow } from "../services/githubWorkflowService";
import prisma from "../lib/prisma";
import type { Prisma, BuildArtifact, BuildJob } from "@prisma/client";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { URL } from "url";
import { normalizeArtifactUrl } from "../lib/artifactUrl";

export const uploadTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = handleTemplateUpload(req.file, (req.body as any)?.description);
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

export const listUploadedTemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = listTemplates();
    const simplified = templates.map(({ filename, modifiedAt, description }) => ({ filename, modifiedAt, description }));
    res.json(simplified);
  } catch (err) {
    next(err);
  }
};

export const removeTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    deleteTemplate(filename);
    res.json({ success: true });
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

export const renameUploadedTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const { newName } = req.body ?? {};
    if (!newName) {
      return res.status(400).json({ error: "缺少新文件名" });
    }
    renameTemplate(filename, newName);
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
    const template = getTemplateEntry(filename);
    if (!template) {
      return res.status(404).json({ error: "模板不存在" });
    }

    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const job = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const dbUser: any = await tx.user.findUnique({
        where: { id: Number(user.sub) },
      });
      if (!dbUser) {
        throw new Error("User not found");
      }
      const isAdmin = dbUser.role === "admin";

      if (!isAdmin) {
        const now = new Date();
        const isSameDay = dbUser.buildQuotaDate && new Date(dbUser.buildQuotaDate).toDateString() === now.toDateString();
        const used = isSameDay ? dbUser.buildQuotaUsed || 0 : 0;
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
          envJson: envContent,
          status: template.type === "github" ? "queued" : "pending",
          message: template.type === "github" ? "已提交到 GitHub Actions" : null,
        },
      });
    });

    if (template.type === "github") {
      try {
        await dispatchGithubWorkflow(template, job.id, envContent);
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
    }

    res.json({ message: "已加入构建队列", jobId: job.id });
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
      try {
        const u = new URL(remoteUrl);
        filename = path.basename(u.pathname) || filename;
      } catch {
        // fallback to stored sourceFilename
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
    return res.download(artifact.outputPath, path.basename(artifact.outputPath));
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
