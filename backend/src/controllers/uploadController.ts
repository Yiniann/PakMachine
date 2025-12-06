import { Request, Response, NextFunction } from "express";
import { deleteTemplate, handleTemplateUpload, listTemplates, renameTemplate } from "../services/uploadService";

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
