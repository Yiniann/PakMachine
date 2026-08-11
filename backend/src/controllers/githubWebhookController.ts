import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { deleteGithubRunArtifacts, verifyGithubWebhook } from "../services/githubWorkflowService";
import { normalizeArtifactUrl } from "../lib/artifactUrl";
import { detectArtifactExtension } from "../lib/artifactFilename";
import { getTemplateEntry } from "../services/uploadService";

type GithubWebhookPayload = {
  jobId?: number | string;
  status?: "queued" | "running" | "success" | "failed";
  message?: string;
  artifactUrl?: string;
  artifactFilename?: string;
  githubRunId?: number | string;
  objectKey?: string;
  size?: number;
  sha256?: string;
  platform?: string;
  arch?: string;
  version?: string;
};

const ARTIFACT_HISTORY_LIMIT = 5;

const formatArtifactTimestamp = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || "";
  const yy = get("year").padStart(2, "0");
  const m = get("month").padStart(2, "0");
  const d = get("day").padStart(2, "0");
  const hh = get("hour").padStart(2, "0");
  const mm = get("minute").padStart(2, "0");
  return `${yy}${m}${d}_${hh}${mm}`;
};

const buildArtifactFilename = (siteName: string | null | undefined, baseName: string | undefined, createdAt?: Date) => {
  const ext = detectArtifactExtension(baseName) || ".zip";
  const safeSiteName = (siteName || "site").trim().replace(/[\\/:*?"<>|\u0000-\u001F]+/g, "_") || "site";
  const stamp = formatArtifactTimestamp(createdAt ?? new Date());
  return `${safeSiteName}-${stamp}${ext}`;
};

export const handleGithubBuildWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    const signature = req.get("x-hub-signature-256") || req.get("X-Hub-Signature-256");

    if (!verifyGithubWebhook(rawBody, signature)) {
      return res.status(401).json({ error: "签名校验失败" });
    }

    const payload: GithubWebhookPayload = req.body;
    const jobId = Number(payload?.jobId);
    const status = payload?.status;
    const message = payload?.message;
    const artifactUrl = payload?.artifactUrl;
    const artifactFilename = payload?.artifactFilename;
    const githubRunId = payload?.githubRunId;

    if (!jobId || !status) {
      return res.status(400).json({ error: "缺少 jobId 或 status" });
    }

    const job = await prisma.buildJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const isClientBuild = job.buildKind === "client";
    let artifactId: number | undefined;
    if (!isClientBuild && status === "success" && artifactUrl) {
      const normalizedArtifactUrl = normalizeArtifactUrl(artifactUrl) ?? artifactUrl;
      const artifact = await prisma.$transaction(async (tx) => {
        const owner = await tx.user.findUnique({
          where: { id: job.userId },
          select: { siteName: true },
        });
        const sourceFilename = buildArtifactFilename((job as any).siteNameSnapshot ?? owner?.siteName, artifactFilename || job.filename, job.createdAt);
        const created = await tx.buildArtifact.create({
          data: {
            userId: job.userId,
            sourceFilename,
            outputPath: normalizedArtifactUrl,
          },
        });
        const oldArtifacts = await tx.buildArtifact.findMany({
          where: { userId: job.userId },
          orderBy: { id: "desc" },
          skip: ARTIFACT_HISTORY_LIMIT,
          select: { id: true },
        });
        if (oldArtifacts.length > 0) {
          await tx.buildArtifact.deleteMany({
            where: { id: { in: oldArtifacts.map((item) => item.id) } },
          });
        }
        return created;
      });
      artifactId = artifact.id;
    }

    if (!isClientBuild && status === "success" && githubRunId) {
      const template = getTemplateEntry(job.filename);
      if (template?.type === "github" && template.repo) {
        try {
          await deleteGithubRunArtifacts(template.repo, githubRunId);
        } catch (err) {
          console.warn(`[githubWebhook] Failed to delete GitHub artifacts for run ${githubRunId}:`, err);
        }
      }
    }

    if (isClientBuild && status === "success") {
      const objectKey = String(payload.objectKey || "");
      const size = Number(payload.size);
      const sha256 = String(payload.sha256 || "").toLowerCase();
      const platform = String(payload.platform || "");
      const arch = String(payload.arch || "");
      const version = String(payload.version || "");
      const expectedPrefix = `client-packages/job-${job.id}/`;
      if (!objectKey.startsWith(expectedPrefix) || objectKey.includes("..")) return res.status(400).json({ error: "objectKey 不合法" });
      if (!artifactFilename || artifactFilename.includes("/") || artifactFilename.includes("\\")) return res.status(400).json({ error: "artifactFilename 不合法" });
      if (!Number.isSafeInteger(size) || size < 1 || size > 2_000_000_000) return res.status(400).json({ error: "size 不合法" });
      if (!/^[a-f0-9]{64}$/.test(sha256)) return res.status(400).json({ error: "sha256 不合法" });
      if (platform !== job.platform) return res.status(400).json({ error: "platform 与任务不匹配" });
      if (!arch || !version) return res.status(400).json({ error: "缺少 arch 或 version" });
      await prisma.buildJob.update({
        where: { id: jobId },
        data: {
          status,
          message: message ?? undefined,
          objectKey,
          artifactFilename,
          artifactSize: size,
          artifactSha256: sha256,
          platform,
          arch,
          version,
          githubRunId: githubRunId ? String(githubRunId) : undefined,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return res.json({ ok: true });
    }

    await prisma.buildJob.update({
      where: { id: jobId },
      data: {
        status,
        message: message ?? undefined,
        artifactId,
        githubRunId: githubRunId ? String(githubRunId) : undefined,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
