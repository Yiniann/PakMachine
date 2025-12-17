import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

export type SystemSettings = {
  siteName?: string;
  allowRegister?: boolean;
  actionDispatchToken?: string;
  actionWebhookSecret?: string;
  workflowFile?: string;
  initialized?: boolean;
  mailerHost?: string;
  mailerPort?: number;
  mailerSecure?: boolean;
  mailerUser?: string;
  mailerPass?: string;
  mailerFrom?: string;
  passwordResetBaseUrl?: string;
};

const settingsPath = path.join(__dirname, "../../config/system-settings.json");

export const loadSettings = (): SystemSettings => {
  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return { allowRegister: true };
  }
};

export const saveSettings = (settings: SystemSettings) => {
  const dir = path.dirname(settingsPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
};

export const isInitialized = () => {
  const settings = loadSettings();
  return Boolean(settings.initialized);
};

// 更严格的初始化检查：当配置标记已初始化但数据库里没有任何用户时，回退为未初始化，避免跳过首次引导。
export const checkAndFixInitialization = async () => {
  const settings = loadSettings();
  let initialized = Boolean(settings.initialized);
  if (initialized) {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        initialized = false;
        saveSettings({ ...settings, initialized: false });
      }
    } catch (err) {
      // 数据库不可用时不抛出，沿用原状态，但记录日志便于排查
      console.warn("[init] failed to verify user count, keep current initialized flag", err);
    }
  }
  return initialized;
};

export const getSystemSettings = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = loadSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const getPublicSystemSettings = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteName } = loadSettings();
    res.json({ siteName: siteName ?? null });
  } catch (err) {
    next(err);
  }
};

export const updateSystemSettings = (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as SystemSettings;
    const current = loadSettings();
    const merged = {
      ...current,
      ...payload,
    };
    if (payload.mailerPort !== undefined) {
      const parsed = Number(payload.mailerPort);
      merged.mailerPort = Number.isFinite(parsed) ? parsed : undefined;
    }
    if (payload.mailerSecure !== undefined) {
      merged.mailerSecure = Boolean(payload.mailerSecure);
    }
    saveSettings(merged);
    res.json(merged);
  } catch (err) {
    next(err);
  }
};
