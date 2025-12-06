import { Request, Response, NextFunction } from "express";
import { deleteTemplate, handleTemplateUpload, listTemplates, renameTemplate } from "../services/uploadService";
import { buildTemplate } from "../services/buildService";
import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";

export const uploadTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = handleTemplateUpload(req.file);
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

export const listUploadedTemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(listTemplates());
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
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const payload = await buildTemplate(prisma, Number(user.sub), filename, envContent);
    res.json({ message: "构建成功", downloadPath: payload.downloadPath, artifactId: payload.artifactId });
  } catch (err) {
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
    if (!fs.existsSync(artifact.outputPath)) {
      return res.status(404).json({ error: "文件已不存在" });
    }
    return res.download(artifact.outputPath, path.basename(artifact.outputPath));
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
    const data = artifacts.map((a) => ({
      id: a.id,
      sourceFilename: a.sourceFilename,
      createdAt: a.createdAt,
    }));
    res.json(data);
  } catch (err) {
    next(err);
  }
};
