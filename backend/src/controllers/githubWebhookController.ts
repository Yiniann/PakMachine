import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { verifyGithubWebhook } from "../services/githubWorkflowService";
import { normalizeArtifactUrl } from "../lib/artifactUrl";

type GithubWebhookPayload = {
  jobId?: number | string;
  status?: "queued" | "running" | "success" | "failed";
  message?: string;
  artifactUrl?: string;
  artifactFilename?: string;
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

    if (!jobId || !status) {
      return res.status(400).json({ error: "缺少 jobId 或 status" });
    }

    const job = await prisma.buildJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    let artifactId: number | undefined;
    if (status === "success" && artifactUrl) {
      const normalizedArtifactUrl = normalizeArtifactUrl(artifactUrl) ?? artifactUrl;
      const artifact = await prisma.buildArtifact.create({
        data: {
          userId: job.userId,
          sourceFilename: artifactFilename || job.filename,
          outputPath: normalizedArtifactUrl,
        },
      });
      artifactId = artifact.id;
    }

    await prisma.buildJob.update({
      where: { id: jobId },
      data: {
        status,
        message: message ?? undefined,
        artifactId,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
