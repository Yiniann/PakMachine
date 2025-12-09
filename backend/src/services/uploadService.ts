import fs from "fs";
import path from "path";
import { uploadBaseDir } from "../middleware/upload";

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type TemplateMeta = Record<
  string,
  {
    description?: string;
  }
>;

const metaFilePath = path.join(uploadBaseDir, ".meta.json");

const readTemplateMeta = (): TemplateMeta => {
  try {
    if (!fs.existsSync(metaFilePath)) return {};
    const content = fs.readFileSync(metaFilePath, "utf-8");
    if (!content.trim()) return {};
    const parsed = JSON.parse(content);
    return typeof parsed === "object" && parsed ? (parsed as TemplateMeta) : {};
  } catch {
    return {};
  }
};

const writeTemplateMeta = (meta: TemplateMeta) => {
  fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 2), "utf-8");
};

const setTemplateDescription = (filename: string, description?: string) => {
  const meta = readTemplateMeta();
  const desc = description?.trim();
  if (desc) {
    meta[filename] = { description: desc };
  } else {
    delete meta[filename];
  }
  writeTemplateMeta(meta);
};

const renameTemplateMeta = (oldName: string, newName: string) => {
  const meta = readTemplateMeta();
  if (meta[oldName]) {
    meta[newName] = meta[oldName];
    delete meta[oldName];
    writeTemplateMeta(meta);
  }
};

const removeTemplateMeta = (filename: string) => {
  const meta = readTemplateMeta();
  if (meta[filename]) {
    delete meta[filename];
    writeTemplateMeta(meta);
  }
};

const ensureInsideBase = (filename: string) => {
  if (filename.includes("..") || filename.includes("/")) {
    throw new UploadError("非法文件名", 400);
  }
  return path.join(uploadBaseDir, filename);
};

export const handleTemplateUpload = (file?: Express.Multer.File, description?: string) => {
  if (!file) {
    throw new UploadError("未收到文件", 400);
  }

  const normalizedDesc = typeof description === "string" ? description.trim() : undefined;
  if (normalizedDesc) {
    setTemplateDescription(file.filename, normalizedDesc);
  }

  return {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    storedAt: `uploads/templates/${file.filename}`,
    description: normalizedDesc,
  };
};

export const listTemplates = () => {
  const files = fs.readdirSync(uploadBaseDir).filter((name) => name !== path.basename(metaFilePath));
  const meta = readTemplateMeta();
  return files.map((name) => {
    const full = path.join(uploadBaseDir, name);
    const stat = fs.statSync(full);
    return {
      filename: name,
      size: stat.size,
      modifiedAt: stat.mtime,
      description: meta[name]?.description,
    };
  });
};

export const deleteTemplate = (filename: string) => {
  const full = ensureInsideBase(filename);
  if (!fs.existsSync(full)) {
    throw new UploadError("文件不存在", 404);
  }
  fs.unlinkSync(full);
  removeTemplateMeta(filename);
  return true;
};

export const renameTemplate = (oldName: string, newName: string) => {
  const from = ensureInsideBase(oldName);
  const to = ensureInsideBase(newName);
  if (!fs.existsSync(from)) {
    throw new UploadError("文件不存在", 404);
  }
  fs.renameSync(from, to);
  renameTemplateMeta(oldName, newName);
  return true;
};
