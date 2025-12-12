import { Request, Response, NextFunction } from "express";
import prisma, { reloadPrisma, testDatabaseConnection } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { loadSettings, saveSettings, isInitialized, SystemSettings } from "./systemSettingsController";
import fs from "fs";
import path from "path";
import { startBuildWorker } from "../services/buildWorker";
import { spawn } from "child_process";

export const checkInitialized = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const inited = isInitialized();
    res.json({ initialized: inited });
  } catch (err) {
    next(err);
  }
};

type InitPayload = {
  email?: string;
  password?: string;
  siteName?: string;
  allowRegister?: boolean;
  databaseUrl?: string;
};

const envPath = path.resolve(__dirname, "../../.env");
const repoRoot = path.resolve(__dirname, "../..");

const parsePostInitCommands = (): string[] => {
  const multi = process.env.POST_INIT_COMMANDS;
  if (multi) {
    try {
      const parsed = JSON.parse(multi);
      if (Array.isArray(parsed)) {
        return parsed.map((c) => String(c).trim()).filter(Boolean);
      }
    } catch {
      // fall through to other parsing options
    }
    return multi
      .split(/\r?\n/)
      .map((c) => c.trim())
      .filter(Boolean);
  }
  const single = process.env.POST_INIT_COMMAND;
  if (single) {
    return single
      .split("&&")
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return [];
};

const runCommandSequential = (command: string, cwd: string) =>
  new Promise<void>((resolve, reject) => {
    console.log(`[init] running post-init command in ${cwd}: ${command}`);
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
      stdio: "inherit", // stream output to the server log for debugging
    });
    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`[init] post-init command succeeded: ${command}`);
        resolve();
      } else {
        reject(new Error(`post-init command failed with code ${code}: ${command}`));
      }
    });
    child.on("error", (err) => reject(err));
  });

const runPostInitHooks = () => {
  const commands = parsePostInitCommands();
  if (!commands.length) return;
  const cwd = process.env.POST_INIT_CWD || repoRoot;
  (async () => {
    for (const cmd of commands) {
      await runCommandSequential(cmd, cwd);
    }
  })().catch((err) => {
    console.error("[init] POST_INIT_COMMAND(S) failed:", err);
  });
};

const upsertDatabaseUrl = (databaseUrl: string) => {
  const lines: string[] = [];
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of raw) {
      if (line.trim().startsWith("DATABASE_URL=")) continue;
      if (line.trim() === "") continue;
      lines.push(line);
    }
  }
  lines.push(`DATABASE_URL=${databaseUrl}`);
  fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf8");
};

export const initializeSystem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isInitialized()) {
      return res.status(400).json({ error: "系统已初始化" });
    }
    const { email, password, siteName, allowRegister, databaseUrl } = (req.body || {}) as InitPayload;
    if (databaseUrl) {
      // 先验证连接可用再落盘并热重载 Prisma
      await testDatabaseConnection(databaseUrl);
      upsertDatabaseUrl(databaseUrl);
      await reloadPrisma(databaseUrl);
    }
    await testDatabaseConnection();
    if (!email || !password) {
      return res.status(400).json({ error: "缺少 email 或 password" });
    }
    const hashed = await bcrypt.hash(password, 10);

    // 如果管理员已存在则复用，避免重复创建导致唯一约束报错
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email,
            password: hashed,
            role: "admin",
          },
        });
      } catch (err: any) {
        // 处理并发/重复初始化导致的唯一约束报错，回退到查询已有用户
        if (err?.code === "P2002") {
          user = await prisma.user.findUnique({ where: { email } });
        } else {
          throw err;
        }
      }
    }
    if (!user) {
      throw new Error("创建管理员失败");
    }

    const current = loadSettings();
    const merged: SystemSettings = {
      ...current,
      siteName: siteName ?? current.siteName,
      allowRegister: allowRegister ?? current.allowRegister,
      initialized: true,
    };
    saveSettings(merged);

    // 初始化完成后再启动后台构建轮询
    startBuildWorker();
    // 可选：自动执行部署/构建脚本（通过环境变量配置）
    runPostInitHooks();

    res.json({ success: true, adminId: user.id });
  } catch (err) {
    next(err);
  }
};
