export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const handleTemplateUpload = (file?: Express.Multer.File) => {
  if (!file) {
    throw new UploadError("未收到文件", 400);
  }

  return {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    storedAt: `uploads/templates/${file.filename}`,
  };
};

import fs from "fs";
import path from "path";
import { uploadBaseDir } from "../middleware/upload";

const ensureInsideBase = (filename: string) => {
  if (filename.includes("..") || filename.includes("/")) {
    throw new UploadError("非法文件名", 400);
  }
  return path.join(uploadBaseDir, filename);
};

export const listTemplates = () => {
  const files = fs.readdirSync(uploadBaseDir);
  return files.map((name) => {
    const full = path.join(uploadBaseDir, name);
    const stat = fs.statSync(full);
    return {
      filename: name,
      size: stat.size,
      modifiedAt: stat.mtime,
    };
  });
};

export const deleteTemplate = (filename: string) => {
  const full = ensureInsideBase(filename);
  if (!fs.existsSync(full)) {
    throw new UploadError("文件不存在", 404);
  }
  fs.unlinkSync(full);
  return true;
};

export const renameTemplate = (oldName: string, newName: string) => {
  const from = ensureInsideBase(oldName);
  const to = ensureInsideBase(newName);
  if (!fs.existsSync(from)) {
    throw new UploadError("文件不存在", 404);
  }
  fs.renameSync(from, to);
  return true;
};
