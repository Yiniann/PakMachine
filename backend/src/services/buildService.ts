import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { execSync } from "child_process";
import { uploadBaseDir } from "../middleware/upload";
import { UploadError } from "./uploadService";
import type { PrismaClient } from "@prisma/client";

const buildBaseDir = path.resolve(uploadBaseDir, "../builds");
fs.mkdirSync(buildBaseDir, { recursive: true });

const sanitizeName = (name: string) => {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    throw new UploadError("非法文件名", 400);
  }
  return name;
};

const getSafePath = (filename: string) => path.join(uploadBaseDir, sanitizeName(filename));

export const buildTemplate = async (prisma: PrismaClient, userId: number, filename: string, envContent: string) => {
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
    const timeoutMs = 10 * 60 * 1000; // 10 minutes safety timeout
    const hasPnpmLock = fs.existsSync(path.join(projectDir, "pnpm-lock.yaml"));
    const hasNpmLock = fs.existsSync(path.join(projectDir, "package-lock.json"));
    const installCmd = hasPnpmLock ? "pnpm install --frozen-lockfile" : hasNpmLock ? "npm ci" : "npm install";
    const buildCmd = hasPnpmLock ? "pnpm run build" : "npm run build";

    execSync(installCmd, { cwd: projectDir, stdio: "inherit", timeout: timeoutMs });
    execSync(buildCmd, { cwd: projectDir, stdio: "inherit", timeout: timeoutMs });
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

  const artifact = await prisma.buildArtifact.create({
    data: {
      userId,
      sourceFilename: filename,
      outputPath: outputPath,
    },
  });

  // 仅保留该用户最新的 2 个构建产物，删除更早的记录与文件
  const extras = await prisma.buildArtifact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 2,
  });
  for (const extra of extras) {
    if (extra.outputPath && fs.existsSync(extra.outputPath)) {
      fs.unlinkSync(extra.outputPath);
    }
    await prisma.buildArtifact.delete({ where: { id: extra.id } });
  }

  return {
    downloadPath: `uploads/builds/${outputName}`,
    artifactId: artifact.id,
  };
};
