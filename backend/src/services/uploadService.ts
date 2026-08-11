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
export type TemplatePurpose = "web" | "client";
type TemplateMetaEntry = {
  type?: TemplateType;
  purpose?: TemplatePurpose;
  description?: string;
  repo?: string;
  branch?: string;
  workdir?: string;
  workflowFile?: string;
  createdAt?: string;
};
type TemplateMeta = Record<string, TemplateMetaEntry>;
export type TemplateEntry = {
  filename: string;
  type: TemplateType;
  purpose: TemplatePurpose;
  description?: string;
  size?: number;
  modifiedAt?: Date;
  repo?: string;
  branch?: string;
  workdir?: string;
  workflowFile?: string;
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

const normalizePurpose = (value: unknown): TemplatePurpose => value === "client" ? "client" : "web";

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
      purpose: normalizePurpose(entry?.purpose),
      repo: entry?.repo,
      branch: entry?.branch,
      workdir: entry?.workdir,
      workflowFile: entry?.workflowFile,
    };
  });

  // Append github-only entries that have no physical file
  const githubEntries: TemplateEntry[] = Object.entries(meta)
    .filter(([, value]) => (value.type ?? "upload") === "github")
    .filter(([name]) => !uploads.find((u) => u.filename === name))
    .map(([name, value]) => ({
      filename: name,
      type: "github" as TemplateType,
      purpose: normalizePurpose(value.purpose),
      description: value.description,
      repo: value.repo,
      branch: value.branch,
      workdir: value.workdir,
      workflowFile: value.workflowFile,
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
      purpose: normalizePurpose(metaEntry?.purpose),
      description: metaEntry?.description,
      repo: metaEntry?.repo,
      branch: metaEntry?.branch,
      workdir: metaEntry?.workdir,
      workflowFile: metaEntry?.workflowFile,
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
    purpose: "web",
    description: metaEntry?.description,
    size: stat.size,
    modifiedAt: stat.mtime,
  };
};

export const listGithubTemplates = (purpose?: TemplatePurpose) => {
  const meta = readTemplateMeta();
  return Object.entries(meta)
    .filter(([, value]) => (value.type ?? "upload") === "github")
    .filter(([, value]) => !purpose || normalizePurpose(value.purpose) === purpose)
    .map(([name, value]) => ({
      name,
      purpose: normalizePurpose(value.purpose),
      repo: value.repo || "",
      branch: value.branch || "main",
      workdir: value.workdir || "",
      workflowFile: value.workflowFile || (normalizePurpose(value.purpose) === "client" ? "package-client.yml" : "package.yml"),
      description: value.description || "",
      createdAt: value.createdAt || "",
    }))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
};

export const createGithubTemplate = (input: {
  name: string;
  purpose?: TemplatePurpose;
  repo: string;
  branch?: string;
  workdir?: string;
  workflowFile?: string;
  description?: string;
}) => {
  const name = normalizeName(input.name.trim());
  const repo = input.repo.trim();
  if (input.purpose && input.purpose !== "web" && input.purpose !== "client") {
    throw new UploadError("模板用途必须是 web 或 client", 400);
  }
  const purpose = normalizePurpose(input.purpose);
  const workflowFile = input.workflowFile?.trim() || (purpose === "client" ? "package-client.yml" : "package.yml");
  if (!repo) {
    throw new UploadError("仓库地址不能为空", 400);
  }
  if (workflowFile.includes("/") || workflowFile.includes("\\") || !/\.ya?ml$/i.test(workflowFile)) {
    throw new UploadError("Workflow 文件名必须是 .yml 或 .yaml 文件名", 400);
  }
  const meta = readTemplateMeta();
  if (meta[name]) {
    throw new UploadError("模板名称已存在，请更换", 400);
  }
  const fileExists = fs.existsSync(path.join(uploadBaseDir, name));
  if (fileExists) {
    throw new UploadError("已存在同名上传模板，请更换名称", 400);
  }
  if (Object.values(meta).some((entry) =>
    (entry.type ?? "upload") === "github" && normalizePurpose(entry.purpose) === purpose)) {
    throw new UploadError(`${purpose === "client" ? "客户端" : "Web"} 模板已存在，请先删除原模板`, 400);
  }
  meta[name] = {
    type: "github",
    purpose,
    repo,
    branch: input.branch?.trim() || "main",
    workdir: input.workdir?.trim() || "",
    workflowFile,
    description: input.description?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  writeTemplateMeta(meta);
  return true;
};

export const getClientGithubTemplate = (): TemplateEntry | null => {
  const clientTemplate = listGithubTemplates("client")[0];
  return clientTemplate ? getTemplateEntry(clientTemplate.name) : null;
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
