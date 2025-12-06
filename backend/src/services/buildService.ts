import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { execSync } from "child_process";
import { uploadBaseDir } from "../middleware/upload";
import { UploadError } from "./uploadService";

const buildBaseDir = path.resolve(uploadBaseDir, "../builds");
fs.mkdirSync(buildBaseDir, { recursive: true });

const sanitizeName = (name: string) => {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    throw new UploadError("非法文件名", 400);
  }
  return name;
};

const getSafePath = (filename: string) => path.join(uploadBaseDir, sanitizeName(filename));

export const buildTemplate = async (filename: string, envContent: string) => {
  const source = getSafePath(filename);
  if (!fs.existsSync(source)) {
    throw new UploadError("模板文件不存在", 404);
  }
  const ts = Date.now();
  const workDir = path.join(buildBaseDir, `work-${ts}`);
  fs.mkdirSync(workDir, { recursive: true });

  // 解压模板
  const zip = new AdmZip(source);
  zip.extractAllTo(workDir, true);

  // 找到包含 package.json 的目录（支持压缩包内有一层目录的情况）
  const findPkgDir = (dir: string, depth = 0): string | null => {
    if (depth > 2) return null; // 避免过深遍历
    const candidate = path.join(dir, "package.json");
    if (fs.existsSync(candidate)) return dir;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const found = findPkgDir(path.join(dir, entry.name), depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  const projectDir = findPkgDir(workDir);
  if (!projectDir) {
    throw new UploadError("模板中缺少 package.json，无法执行构建", 400);
  }

  // 写入 .env 到项目根
  fs.writeFileSync(path.join(projectDir, ".env"), envContent ?? "", "utf8");

  // 执行构建
  let buildTarget = projectDir;
  try {
    const nodeModules = path.join(projectDir, "node_modules");
    if (fs.existsSync(nodeModules)) {
      fs.rmSync(nodeModules, { recursive: true, force: true });
    }
    const hasLock = fs.existsSync(path.join(projectDir, "package-lock.json"));
    execSync(hasLock ? "npm ci" : "npm install", { cwd: projectDir, stdio: "inherit" });
    execSync("npm run build", { cwd: projectDir, stdio: "inherit" });
    const distDir = fs.existsSync(path.join(projectDir, "dist"))
      ? path.join(projectDir, "dist")
      : fs.existsSync(path.join(projectDir, "build"))
        ? path.join(projectDir, "build")
        : null;
    if (!distDir) {
      throw new UploadError("未找到构建产物目录（dist 或 build）", 500);
    }
    buildTarget = distDir;
  } catch (err) {
    throw new UploadError("构建失败，请检查模板或依赖", 500);
  }

  // 压缩构建结果
  const outputName = `${path.parse(filename).name}-build-${ts}.zip`;
  const outputPath = path.join(buildBaseDir, outputName);
  const outZip = new AdmZip();
  outZip.addLocalFolder(buildTarget);
  outZip.writeZip(outputPath);

  return {
    downloadPath: `uploads/builds/${outputName}`,
  };
};
