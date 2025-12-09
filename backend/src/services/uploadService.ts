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

type TemplateType = "upload" | "github";
type TemplateMetaEntry = {
  type?: TemplateType;
  description?: string;
  repo?: string;
  branch?: string;
  workdir?: string;
};
type TemplateMeta = Record<string, TemplateMetaEntry>;
export type TemplateEntry = {
  filename: string;
  type: TemplateType;
  description?: string;
  size?: number;
  modifiedAt?: Date;
  repo?: string;
  branch?: string;
  workdir?: string;
};

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

const normalizeName = (name: string) => {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    throw new UploadError("非法文件名", 400);
  }
  return name;
};

const setUploadTemplateMeta = (filename: string, description?: string) => {
  const meta = readTemplateMeta();
  const desc = description?.trim();
  meta[filename] = { ...(meta[filename] || {}), type: "upload", description: desc || undefined };
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
  setUploadTemplateMeta(file.filename, normalizedDesc);

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
  const uploads: TemplateEntry[] = files.map((name) => {
    const full = path.join(uploadBaseDir, name);
    const stat = fs.statSync(full);
    const entry = meta[name];
    const type: TemplateType = entry?.type === "github" ? "github" : "upload";
    return {
      filename: name,
      size: stat.size,
      modifiedAt: stat.mtime,
      description: entry?.description,
      type,
      repo: entry?.repo,
      branch: entry?.branch,
      workdir: entry?.workdir,
    };
  });

  // Append github-only entries that have no physical file
  const githubEntries: TemplateEntry[] = Object.entries(meta)
    .filter(([, value]) => (value.type ?? "upload") === "github")
    .filter(([name]) => !uploads.find((u) => u.filename === name))
    .map(([name, value]) => ({
      filename: name,
      type: "github" as TemplateType,
      description: value.description,
      repo: value.repo,
      branch: value.branch,
      workdir: value.workdir,
    }));

  return [...uploads, ...githubEntries];
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

export const getTemplateEntry = (filename: string): TemplateEntry | null => {
  const name = normalizeName(filename);
  const meta = readTemplateMeta();
  const metaEntry = meta[name];
  const type: TemplateType = metaEntry?.type === "github" ? "github" : "upload";
  if (type === "github") {
    return {
      filename: name,
      type,
      description: metaEntry?.description,
      repo: metaEntry?.repo,
      branch: metaEntry?.branch,
      workdir: metaEntry?.workdir,
    };
  }
  const full = path.join(uploadBaseDir, name);
  if (!fs.existsSync(full)) {
    return null;
  }
  const stat = fs.statSync(full);
  return {
    filename: name,
    type: "upload",
    description: metaEntry?.description,
    size: stat.size,
    modifiedAt: stat.mtime,
  };
};

export const listGithubTemplates = () => {
  const meta = readTemplateMeta();
  return Object.entries(meta)
    .filter(([, value]) => (value.type ?? "upload") === "github")
    .map(([name, value]) => ({
      name,
      repo: value.repo || "",
      branch: value.branch || "main",
      workdir: value.workdir || "",
      description: value.description || "",
    }));
};

export const createGithubTemplate = (input: { name: string; repo: string; branch?: string; workdir?: string; description?: string }) => {
  const name = normalizeName(input.name.trim());
  const repo = input.repo.trim();
  if (!repo) {
    throw new UploadError("仓库地址不能为空", 400);
  }
  const meta = readTemplateMeta();
  if (meta[name]) {
    throw new UploadError("模板名称已存在，请更换", 400);
  }
  const fileExists = fs.existsSync(path.join(uploadBaseDir, name));
  if (fileExists) {
    throw new UploadError("已存在同名上传模板，请更换名称", 400);
  }
  meta[name] = {
    type: "github",
    repo,
    branch: input.branch?.trim() || "main",
    workdir: input.workdir?.trim() || "",
    description: input.description?.trim() || "",
  };
  writeTemplateMeta(meta);
  return true;
};

export const deleteGithubTemplate = (name: string) => {
  const meta = readTemplateMeta();
  if (!meta[name] || (meta[name].type ?? "upload") !== "github") {
    throw new UploadError("模板不存在", 404);
  }
  delete meta[name];
  writeTemplateMeta(meta);
  return true;
};
